# 出行助手下单 · BFF API 层 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现移动端叫代驾下单链路的服务端 BFF API 层——5 个接口（parse / geo / verify·send / order / order:token）+ 签名 token + 订单状态机，全部基于可替换的 fake adapter，端到端可单测、可 curl 跑通。

**Architecture:** Node + Express 充当 BFF。所有外部能力（LLM、地图、短信、运营商认证、e代驾核心后台）抽象为 adapter 接口，本层注入 **fake 实现**（内存态、确定性），真实 provider 由后续计划替换。API router 通过依赖注入接收 adapter 集合，便于测试。签名 token（HMAC）承载 magic-link 草稿、登录凭证、订单查询凭证。订单状态与时间线由 fake backend 的内存状态机驱动。

**Tech Stack:** TypeScript (CommonJS), Express 4, vitest + supertest, Node crypto (HMAC)。

设计参考：`docs/superpowers/specs/2026-06-27-mobile-web-order-flow-design.md`（§4 链路、§7 接口表）。

---

## 文件结构

| 文件 | 职责 |
|---|---|
| `src/domain/types.ts` | 共享领域类型：`Place` `OrderDraft` `ParseResult` `OrderStatus` `TimelineEvent` `Order` |
| `src/domain/orderStore.ts` | 订单内存存储 + 状态机（创建 / 取详情 / 取消 / 推进状态） |
| `src/lib/token.ts` | HMAC 签名 token 的 `sign` / `verify`（按 `kind` 区分 magic/login/query） |
| `src/lib/rateLimit.ts` | 简单内存限频器（按 key 计数 + 时间窗） |
| `src/adapters/types.ts` | adapter 接口：`LlmAdapter` `GeoAdapter` `SmsAdapter` `CarrierAuthAdapter` `BackendAdapter`；`AppDeps` |
| `src/adapters/fake.ts` | 全部 adapter 的 fake 实现 + `createFakeDeps()` |
| `src/api/geo.ts` | `POST /api/geo`（逆地理编码 / POI 检索） |
| `src/api/parse.ts` | `POST /api/parse`（意图分流 + 两要素解析 + 缺项） |
| `src/api/verify.ts` | `POST /api/verify/send`（发 magic link 短信，含限频/重发上限） |
| `src/api/order.ts` | `POST /api/order`（验证后落单）、`GET /api/order/:token`、`POST /api/order/:token/cancel` |
| `src/api/index.ts` | `createApiRouter(deps)` 组装所有路由 |
| `src/server.ts` | 挂载 `express.json()` + `/api` router（修改） |
| `tests/lib/token.test.ts` 等 | 各单元 / 集成测试 |

约定：金额、坐标等不在本层产生展示串；所有 token 字符串形如 `base64url(payload).hmacSig`。

---

## Task 0: 测试工具链

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: 安装依赖**

Run:
```bash
npm i -D vitest@^2 supertest@^7 @types/supertest@^6
```
Expected: 安装成功，`package.json` devDependencies 出现这三项。

- [ ] **Step 2: 加测试脚本**

修改 `package.json` 的 `scripts`，新增两行（保留已有脚本）：
```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: 写 vitest 配置**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: 冒烟测试**

Create `tests/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('toolchain', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: 运行**

Run: `npm test`
Expected: PASS，1 passed。

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts tests/smoke.test.ts
git commit -m "chore: 引入 vitest + supertest 测试工具链"
```

---

## Task 1: 领域类型

**Files:**
- Create: `src/domain/types.ts`

- [ ] **Step 1: 定义类型**

Create `src/domain/types.ts`:
```ts
export interface Place {
  name: string;
  lng?: number;
  lat?: number;
  confirmed?: boolean;
}

export interface OrderDraft {
  origin?: Place;
  destination?: Place;
  riderPhone?: string;
  note?: string;
}

export type MissingField = 'origin' | 'destination';

export interface ParseResult {
  intent: 'ride' | 'other';
  card: OrderDraft;
  missing: MissingField[];
  ask?: string;
  confidence: number;
  futureTimeDetected: boolean;
}

export type OrderStatus =
  | 'accepted'
  | 'confirmed'
  | 'calling_driver'
  | 'driver_assigned'
  | 'no_driver'
  | 'out_of_range'
  | 'cancelled';

export interface TimelineEvent {
  status: OrderStatus;
  at: number;
}

export interface Order {
  id: string;
  phone: string;
  riderPhone?: string;
  origin: Place;
  destination: Place;
  status: OrderStatus;
  timeline: TimelineEvent[];
  createdAt: number;
}

export const CANCELLABLE: OrderStatus[] = ['accepted', 'confirmed', 'calling_driver'];
```

- [ ] **Step 2: Commit**

```bash
git add src/domain/types.ts
git commit -m "feat(domain): 订单与解析领域类型"
```

---

## Task 2: 订单内存存储 + 状态机

**Files:**
- Create: `src/domain/orderStore.ts`
- Test: `tests/domain/orderStore.test.ts`

- [ ] **Step 1: 写失败测试**

Create `tests/domain/orderStore.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { OrderStore } from '../../src/domain/orderStore';

const draft = {
  origin: { name: '国贸三期' },
  destination: { name: '望京SOHO T3' },
};

describe('OrderStore', () => {
  let store: OrderStore;
  beforeEach(() => { store = new OrderStore(); });

  it('creates an order at accepted with a timeline entry', () => {
    const o = store.create('13800000000', draft.origin, draft.destination);
    expect(o.id).toMatch(/.+/);
    expect(o.status).toBe('accepted');
    expect(o.timeline).toHaveLength(1);
    expect(o.timeline[0].status).toBe('accepted');
  });

  it('retrieves by id', () => {
    const o = store.create('13800000000', draft.origin, draft.destination);
    expect(store.get(o.id)?.id).toBe(o.id);
  });

  it('advances status and appends timeline', () => {
    const o = store.create('13800000000', draft.origin, draft.destination);
    store.advance(o.id, 'confirmed');
    const got = store.get(o.id)!;
    expect(got.status).toBe('confirmed');
    expect(got.timeline.map((t) => t.status)).toEqual(['accepted', 'confirmed']);
  });

  it('cancels when cancellable', () => {
    const o = store.create('13800000000', draft.origin, draft.destination);
    expect(store.cancel(o.id)).toBe(true);
    expect(store.get(o.id)!.status).toBe('cancelled');
  });

  it('refuses cancel after driver assigned', () => {
    const o = store.create('13800000000', draft.origin, draft.destination);
    store.advance(o.id, 'driver_assigned');
    expect(store.cancel(o.id)).toBe(false);
    expect(store.get(o.id)!.status).toBe('driver_assigned');
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/domain/orderStore.test.ts`
Expected: FAIL（`Cannot find module ... orderStore`）。

- [ ] **Step 3: 实现**

Create `src/domain/orderStore.ts`:
```ts
import { randomUUID } from 'crypto';
import { CANCELLABLE, Order, OrderStatus, Place } from './types';

export class OrderStore {
  private orders = new Map<string, Order>();

  create(phone: string, origin: Place, destination: Place, riderPhone?: string): Order {
    const now = Date.now();
    const order: Order = {
      id: randomUUID(),
      phone,
      riderPhone,
      origin,
      destination,
      status: 'accepted',
      timeline: [{ status: 'accepted', at: now }],
      createdAt: now,
    };
    this.orders.set(order.id, order);
    return order;
  }

  get(id: string): Order | undefined {
    return this.orders.get(id);
  }

  advance(id: string, status: OrderStatus): Order | undefined {
    const order = this.orders.get(id);
    if (!order) return undefined;
    order.status = status;
    order.timeline.push({ status, at: Date.now() });
    return order;
  }

  cancel(id: string): boolean {
    const order = this.orders.get(id);
    if (!order || !CANCELLABLE.includes(order.status)) return false;
    order.status = 'cancelled';
    order.timeline.push({ status: 'cancelled', at: Date.now() });
    return true;
  }
}
```

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run tests/domain/orderStore.test.ts`
Expected: PASS（5 passed）。

- [ ] **Step 5: Commit**

```bash
git add src/domain/orderStore.ts tests/domain/orderStore.test.ts
git commit -m "feat(domain): 订单内存存储与状态机"
```

---

## Task 3: 签名 token 库

**Files:**
- Create: `src/lib/token.ts`
- Test: `tests/lib/token.test.ts`

- [ ] **Step 1: 写失败测试**

Create `tests/lib/token.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { signToken, verifyToken } from '../../src/lib/token';

const secret = 'test-secret';

describe('token', () => {
  it('round-trips payload', () => {
    const t = signToken({ kind: 'login', phone: '13800000000' }, secret, 60_000);
    const p = verifyToken(t, secret);
    expect(p?.kind).toBe('login');
    expect(p?.phone).toBe('13800000000');
  });

  it('rejects tampered token', () => {
    const t = signToken({ kind: 'login', phone: '13800000000' }, secret, 60_000);
    const tampered = t.slice(0, -2) + 'xx';
    expect(verifyToken(tampered, secret)).toBeNull();
  });

  it('rejects wrong secret', () => {
    const t = signToken({ kind: 'login', phone: '13800000000' }, secret, 60_000);
    expect(verifyToken(t, 'other')).toBeNull();
  });

  it('rejects expired token', () => {
    const t = signToken({ kind: 'login', phone: '13800000000' }, secret, -1);
    expect(verifyToken(t, secret)).toBeNull();
  });

  it('rejects malformed token', () => {
    expect(verifyToken('garbage', secret)).toBeNull();
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/lib/token.test.ts`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现**

Create `src/lib/token.ts`:
```ts
import { createHmac, timingSafeEqual } from 'crypto';

export interface TokenPayload {
  kind: 'magic' | 'login' | 'query';
  phone: string;
  orderId?: string;
  draft?: unknown;
  exp?: number;
  [key: string]: unknown;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function hmac(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

export function signToken(payload: TokenPayload, secret: string, ttlMs: number): string {
  const body = { ...payload, exp: Date.now() + ttlMs };
  const data = b64url(JSON.stringify(body));
  return `${data}.${hmac(data, secret)}`;
}

export function verifyToken(token: string, secret: string): TokenPayload | null {
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = hmac(data, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const body = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as TokenPayload;
    if (typeof body.exp !== 'number' || body.exp < Date.now()) return null;
    return body;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run tests/lib/token.test.ts`
Expected: PASS（5 passed）。

- [ ] **Step 5: Commit**

```bash
git add src/lib/token.ts tests/lib/token.test.ts
git commit -m "feat(lib): HMAC 签名 token"
```

---

## Task 4: 内存限频器

**Files:**
- Create: `src/lib/rateLimit.ts`
- Test: `tests/lib/rateLimit.test.ts`

- [ ] **Step 1: 写失败测试**

Create `tests/lib/rateLimit.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { RateLimiter } from '../../src/lib/rateLimit';

describe('RateLimiter', () => {
  it('allows up to the limit then blocks', () => {
    const rl = new RateLimiter(2, 1000);
    expect(rl.hit('k')).toBe(true);
    expect(rl.hit('k')).toBe(true);
    expect(rl.hit('k')).toBe(false);
  });

  it('isolates keys', () => {
    const rl = new RateLimiter(1, 1000);
    expect(rl.hit('a')).toBe(true);
    expect(rl.hit('b')).toBe(true);
  });

  it('resets after the window', () => {
    const rl = new RateLimiter(1, 1000);
    let now = 0;
    const rl2 = new RateLimiter(1, 1000, () => now);
    expect(rl2.hit('k')).toBe(true);
    expect(rl2.hit('k')).toBe(false);
    now = 1001;
    expect(rl2.hit('k')).toBe(true);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/lib/rateLimit.test.ts`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现**

Create `src/lib/rateLimit.ts`:
```ts
type Now = () => number;

export class RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private max: number,
    private windowMs: number,
    private now: Now = () => Date.now(),
  ) {}

  hit(key: string): boolean {
    const t = this.now();
    const arr = (this.hits.get(key) ?? []).filter((ts) => t - ts < this.windowMs);
    if (arr.length >= this.max) {
      this.hits.set(key, arr);
      return false;
    }
    arr.push(t);
    this.hits.set(key, arr);
    return true;
  }
}
```

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run tests/lib/rateLimit.test.ts`
Expected: PASS（3 passed）。

- [ ] **Step 5: Commit**

```bash
git add src/lib/rateLimit.ts tests/lib/rateLimit.test.ts
git commit -m "feat(lib): 内存限频器"
```

---

## Task 5: adapter 接口 + fake 实现

**Files:**
- Create: `src/adapters/types.ts`
- Create: `src/adapters/fake.ts`
- Test: `tests/adapters/fake.test.ts`

- [ ] **Step 1: 定义接口**

Create `src/adapters/types.ts`:
```ts
import { OrderDraft, ParseResult, Order, Place } from '../domain/types';

export interface LlmAdapter {
  parse(text: string, city: string): Promise<ParseResult>;
}

export interface GeoResult {
  address?: string;
  pois: Place[];
}

export interface GeoAdapter {
  reverse(lng: number, lat: number, city: string): Promise<GeoResult>;
  search(keyword: string, city: string): Promise<GeoResult>;
}

export interface SmsAdapter {
  send(phone: string, text: string): Promise<void>;
}

export interface CarrierAuthAdapter {
  /** 校验运营商一键登录 token，成功返回手机号，失败返回 null */
  verify(token: string): Promise<string | null>;
}

export interface BackendAdapter {
  createOrder(phone: string, draft: Required<Pick<OrderDraft, 'origin' | 'destination'>> & OrderDraft): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  cancelOrder(id: string): Promise<boolean>;
}

export interface AppDeps {
  llm: LlmAdapter;
  geo: GeoAdapter;
  sms: SmsAdapter;
  carrier: CarrierAuthAdapter;
  backend: BackendAdapter;
  tokenSecret: string;
}
```

- [ ] **Step 2: 写失败测试**

Create `tests/adapters/fake.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { createFakeDeps } from '../../src/adapters/fake';

describe('fake llm', () => {
  it('detects non-ride intent', async () => {
    const { llm } = createFakeDeps();
    const r = await llm.parse('我要代检车', '北京');
    expect(r.intent).toBe('other');
  });

  it('parses origin and destination', async () => {
    const { llm } = createFakeDeps();
    const r = await llm.parse('我在国贸喝多了想去望京SOHO', '北京');
    expect(r.intent).toBe('ride');
    expect(r.card.origin?.name).toBe('国贸');
    expect(r.card.destination?.name).toBe('望京SOHO');
    expect(r.missing).toHaveLength(0);
  });

  it('flags missing destination with an ask', async () => {
    const { llm } = createFakeDeps();
    const r = await llm.parse('我在国贸喝多了', '北京');
    expect(r.missing).toContain('destination');
    expect(r.ask).toBe('要去哪？');
  });

  it('detects future-time intent', async () => {
    const { llm } = createFakeDeps();
    const r = await llm.parse('明天早上送我去机场', '北京');
    expect(r.futureTimeDetected).toBe(true);
  });
});

describe('fake carrier + backend', () => {
  it('carrier verifies token shaped phone', async () => {
    const { carrier } = createFakeDeps();
    expect(await carrier.verify('carrier:13800000000')).toBe('13800000000');
    expect(await carrier.verify('bad')).toBeNull();
  });

  it('backend creates and reads an order', async () => {
    const { backend } = createFakeDeps();
    const o = await backend.createOrder('13800000000', {
      origin: { name: '国贸' },
      destination: { name: '望京' },
    });
    expect((await backend.getOrder(o.id))?.id).toBe(o.id);
  });
});
```

- [ ] **Step 3: 运行确认失败**

Run: `npx vitest run tests/adapters/fake.test.ts`
Expected: FAIL（模块不存在）。

- [ ] **Step 4: 实现 fake**

Create `src/adapters/fake.ts`:
```ts
import { OrderStore } from '../domain/orderStore';
import { OrderDraft, ParseResult } from '../domain/types';
import {
  AppDeps,
  BackendAdapter,
  CarrierAuthAdapter,
  GeoAdapter,
  GeoResult,
  LlmAdapter,
  SmsAdapter,
} from './types';

const fakeLlm: LlmAdapter = {
  async parse(text): Promise<ParseResult> {
    if (/代检|拖车|洗车|保养/.test(text)) {
      return { intent: 'other', card: {}, missing: [], confidence: 0.9, futureTimeDetected: false };
    }
    const futureTimeDetected = /明天|后天|预约|小时后|稍后|稍晚/.test(text);
    const dest = text.match(/(?:去|到|回|送到|送回|回到)\s*([一-龥A-Za-z0-9]+)/)?.[1];
    const origin = text.match(/在\s*([一-龥A-Za-z0-9]+?)(?:喝|附近|这边|，|,|$)/)?.[1];
    const card: OrderDraft = {
      origin: origin ? { name: origin } : undefined,
      destination: dest ? { name: dest } : undefined,
    };
    const missing: ParseResult['missing'] = [];
    if (!card.origin) missing.push('origin');
    if (!card.destination) missing.push('destination');
    const ask = missing[0] === 'destination' ? '要去哪？' : missing[0] === 'origin' ? '你在哪？' : undefined;
    return { intent: 'ride', card, missing, ask, confidence: missing.length ? 0.5 : 0.8, futureTimeDetected };
  },
};

const fakeGeo: GeoAdapter = {
  async reverse(lng, lat, city): Promise<GeoResult> {
    return { address: `${city}某地`, pois: [{ name: `${city}某地A`, lng, lat }, { name: `${city}某地B`, lng, lat }] };
  },
  async search(keyword, city): Promise<GeoResult> {
    return { pois: [{ name: `${keyword}（${city}）`, lng: 116.4, lat: 39.9 }] };
  },
};

class RecordingSms implements SmsAdapter {
  sent: { phone: string; text: string }[] = [];
  async send(phone: string, text: string): Promise<void> {
    this.sent.push({ phone, text });
  }
}

const fakeCarrier: CarrierAuthAdapter = {
  async verify(token): Promise<string | null> {
    const m = token.match(/^carrier:(\d{11})$/);
    return m ? m[1] : null;
  },
};

class FakeBackend implements BackendAdapter {
  constructor(private store = new OrderStore()) {}
  async createOrder(phone: string, draft: OrderDraft) {
    return this.store.create(phone, draft.origin!, draft.destination!, draft.riderPhone);
  }
  async getOrder(id: string) {
    return this.store.get(id);
  }
  async cancelOrder(id: string) {
    return this.store.cancel(id);
  }
  /** 测试 / 演示用：推进状态 */
  store_(): OrderStore {
    return this.store;
  }
}

export function createFakeDeps(secret = 'dev-secret'): AppDeps & { sms: RecordingSms; backend: FakeBackend } {
  return {
    llm: fakeLlm,
    geo: fakeGeo,
    sms: new RecordingSms(),
    carrier: fakeCarrier,
    backend: new FakeBackend(),
    tokenSecret: secret,
  };
}
```

- [ ] **Step 5: 运行确认通过**

Run: `npx vitest run tests/adapters/fake.test.ts`
Expected: PASS（6 passed）。

- [ ] **Step 6: Commit**

```bash
git add src/adapters/types.ts src/adapters/fake.ts tests/adapters/fake.test.ts
git commit -m "feat(adapters): adapter 接口与 fake 实现"
```

---

## Task 6: `POST /api/geo`

**Files:**
- Create: `src/api/geo.ts`
- Create: `src/api/index.ts`
- Test: `tests/api/geo.test.ts`

- [ ] **Step 1: 写失败测试**

Create `tests/api/geo.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createApiRouter } from '../../src/api/index';
import { createFakeDeps } from '../../src/adapters/fake';

function app() {
  const a = express();
  a.use(express.json());
  a.use('/api', createApiRouter(createFakeDeps()));
  return a;
}

describe('POST /api/geo', () => {
  it('reverse geocodes coordinates', async () => {
    const res = await request(app()).post('/api/geo').send({ type: 'reverse', lng: 116.4, lat: 39.9, city: '北京' });
    expect(res.status).toBe(200);
    expect(res.body.pois.length).toBeGreaterThan(0);
  });

  it('searches by keyword', async () => {
    const res = await request(app()).post('/api/geo').send({ type: 'search', keyword: '望京', city: '北京' });
    expect(res.status).toBe(200);
    expect(res.body.pois[0].name).toContain('望京');
  });

  it('rejects bad type', async () => {
    const res = await request(app()).post('/api/geo').send({ type: 'nope' });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/api/geo.test.ts`
Expected: FAIL（`createApiRouter` 不存在）。

- [ ] **Step 3: 实现 geo 路由**

Create `src/api/geo.ts`:
```ts
import { Router, Request, Response } from 'express';
import { AppDeps } from '../adapters/types';

export function geoRouter(deps: AppDeps): Router {
  const r = Router();
  r.post('/geo', async (req: Request, res: Response) => {
    const { type, lng, lat, keyword, city } = req.body ?? {};
    if (type === 'reverse' && typeof lng === 'number' && typeof lat === 'number') {
      return res.json(await deps.geo.reverse(lng, lat, String(city ?? '')));
    }
    if (type === 'search' && typeof keyword === 'string') {
      return res.json(await deps.geo.search(keyword, String(city ?? '')));
    }
    return res.status(400).json({ error: 'bad_request' });
  });
  return r;
}
```

- [ ] **Step 4: 实现 router 组装**

Create `src/api/index.ts`:
```ts
import { Router } from 'express';
import { AppDeps } from '../adapters/types';
import { geoRouter } from './geo';

export function createApiRouter(deps: AppDeps): Router {
  const r = Router();
  r.use(geoRouter(deps));
  return r;
}
```

- [ ] **Step 5: 运行确认通过**

Run: `npx vitest run tests/api/geo.test.ts`
Expected: PASS（3 passed）。

- [ ] **Step 6: Commit**

```bash
git add src/api/geo.ts src/api/index.ts tests/api/geo.test.ts
git commit -m "feat(api): POST /api/geo"
```

---

## Task 7: `POST /api/parse`

**Files:**
- Create: `src/api/parse.ts`
- Modify: `src/api/index.ts`
- Test: `tests/api/parse.test.ts`

- [ ] **Step 1: 写失败测试**

Create `tests/api/parse.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createApiRouter } from '../../src/api/index';
import { createFakeDeps } from '../../src/adapters/fake';

function app() {
  const a = express();
  a.use(express.json());
  a.use('/api', createApiRouter(createFakeDeps()));
  return a;
}

describe('POST /api/parse', () => {
  it('returns a ride card with two elements', async () => {
    const res = await request(app()).post('/api/parse').send({ text: '我在国贸喝多了想去望京SOHO', city: '北京' });
    expect(res.status).toBe(200);
    expect(res.body.intent).toBe('ride');
    expect(res.body.card.destination.name).toBe('望京SOHO');
  });

  it('asks for the missing destination', async () => {
    const res = await request(app()).post('/api/parse').send({ text: '我在国贸喝多了', city: '北京' });
    expect(res.body.missing).toContain('destination');
    expect(res.body.ask).toBe('要去哪？');
  });

  it('rejects empty text', async () => {
    const res = await request(app()).post('/api/parse').send({ text: '', city: '北京' });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/api/parse.test.ts`
Expected: FAIL（路由未注册，destination undefined / 404）。

- [ ] **Step 3: 实现 parse 路由**

Create `src/api/parse.ts`:
```ts
import { Router, Request, Response } from 'express';
import { AppDeps } from '../adapters/types';

export function parseRouter(deps: AppDeps): Router {
  const r = Router();
  r.post('/parse', async (req: Request, res: Response) => {
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const city = String(req.body?.city ?? '');
    if (!text) return res.status(400).json({ error: 'empty_text' });
    const result = await deps.llm.parse(text, city);
    return res.json(result);
  });
  return r;
}
```

- [ ] **Step 4: 注册路由**

Modify `src/api/index.ts` — 引入并挂载 parseRouter：
```ts
import { Router } from 'express';
import { AppDeps } from '../adapters/types';
import { geoRouter } from './geo';
import { parseRouter } from './parse';

export function createApiRouter(deps: AppDeps): Router {
  const r = Router();
  r.use(geoRouter(deps));
  r.use(parseRouter(deps));
  return r;
}
```

- [ ] **Step 5: 运行确认通过**

Run: `npx vitest run tests/api/parse.test.ts`
Expected: PASS（3 passed）。

- [ ] **Step 6: Commit**

```bash
git add src/api/parse.ts src/api/index.ts tests/api/parse.test.ts
git commit -m "feat(api): POST /api/parse"
```

---

## Task 8: `POST /api/verify/send`

**Files:**
- Create: `src/api/verify.ts`
- Modify: `src/api/index.ts`
- Test: `tests/api/verify.test.ts`

设计：输入 `{ phone, draft }`。校验手机号格式 → 限频（每号每窗口上限）→ 生成 `kind:'magic'` token（含 phone + draft）→ 拼成 magic link（用 `req` 推导 origin，或用 `MAGIC_LINK_BASE` 环境变量，测试里走默认 `https://m.edaijia.local`）→ 调 `sms.send` → 返回 `{ sent:true, linkToken }`。超限返回 429。

- [ ] **Step 1: 写失败测试**

Create `tests/api/verify.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createApiRouter } from '../../src/api/index';
import { createFakeDeps } from '../../src/adapters/fake';
import { verifyToken } from '../../src/lib/token';

function setup() {
  const deps = createFakeDeps();
  const a = express();
  a.use(express.json());
  a.use('/api', createApiRouter(deps));
  return { a, deps };
}

const draft = { origin: { name: '国贸' }, destination: { name: '望京' } };

describe('POST /api/verify/send', () => {
  it('sends an sms with a magic link token', async () => {
    const { a, deps } = setup();
    const res = await request(a).post('/api/verify/send').send({ phone: '13800000000', draft });
    expect(res.status).toBe(200);
    expect(res.body.sent).toBe(true);
    const payload = verifyToken(res.body.linkToken, deps.tokenSecret);
    expect(payload?.kind).toBe('magic');
    expect(payload?.phone).toBe('13800000000');
    expect(deps.sms.sent).toHaveLength(1);
    expect(deps.sms.sent[0].text).toContain(res.body.linkToken);
  });

  it('rejects an invalid phone', async () => {
    const { a } = setup();
    const res = await request(a).post('/api/verify/send').send({ phone: '123', draft });
    expect(res.status).toBe(400);
  });

  it('rate-limits resends per phone', async () => {
    const { a } = setup();
    let last = 200;
    for (let i = 0; i < 7; i++) {
      last = (await request(a).post('/api/verify/send').send({ phone: '13900000000', draft })).status;
    }
    expect(last).toBe(429);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/api/verify.test.ts`
Expected: FAIL（路由未注册）。

- [ ] **Step 3: 实现 verify 路由**

Create `src/api/verify.ts`:
```ts
import { Router, Request, Response } from 'express';
import { AppDeps } from '../adapters/types';
import { signToken } from '../lib/token';
import { RateLimiter } from '../lib/rateLimit';

const PHONE_RE = /^1\d{10}$/;
const MAGIC_TTL_MS = 10 * 60_000;

export function verifyRouter(deps: AppDeps): Router {
  const r = Router();
  const limiter = new RateLimiter(5, 60 * 60_000);
  const base = process.env.MAGIC_LINK_BASE || 'https://m.edaijia.local';

  r.post('/verify/send', async (req: Request, res: Response) => {
    const phone = String(req.body?.phone ?? '');
    const draft = req.body?.draft;
    if (!PHONE_RE.test(phone)) return res.status(400).json({ error: 'bad_phone' });
    if (!limiter.hit(phone)) return res.status(429).json({ error: 'too_many', fallback: 'manual_callback' });

    const linkToken = signToken({ kind: 'magic', phone, draft }, deps.tokenSecret, MAGIC_TTL_MS);
    const link = `${base}/m/verify?t=${linkToken}`;
    await deps.sms.send(phone, `【e代驾】点击完成下单：${link}`);
    return res.json({ sent: true, linkToken });
  });
  return r;
}
```

- [ ] **Step 4: 注册路由**

Modify `src/api/index.ts` — 增加 `import { verifyRouter } from './verify';` 并在 `createApiRouter` 内加 `r.use(verifyRouter(deps));`（放在 parseRouter 之后）。

- [ ] **Step 5: 运行确认通过**

Run: `npx vitest run tests/api/verify.test.ts`
Expected: PASS（3 passed）。

- [ ] **Step 6: Commit**

```bash
git add src/api/verify.ts src/api/index.ts tests/api/verify.test.ts
git commit -m "feat(api): POST /api/verify/send（magic link + 限频）"
```

---

## Task 9: `POST /api/order`（验证后落单）

**Files:**
- Create: `src/api/order.ts`
- Modify: `src/api/index.ts`
- Test: `tests/api/order-create.test.ts`

设计：入参 `{ auth: { type, token }, draft? }`。三种 auth：
- `type:'magic'` → `verifyToken` 取 `kind:'magic'` → phone + draft（来自 token，忽略 body.draft）。
- `type:'carrier'` → `deps.carrier.verify(token)` → phone；draft 取 body.draft。
- `type:'login'` → `verifyToken` 取 `kind:'login'` → phone；draft 取 body.draft。
任一失败 → 401。draft 缺起点或终点 → 400。成功 → `backend.createOrder` → 签发 `queryToken`(kind:'query', orderId, phone) 与 `loginCredential`(kind:'login', phone) → 返回 `{ orderId, queryToken, loginCredential }`。

- [ ] **Step 1: 写失败测试**

Create `tests/api/order-create.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createApiRouter } from '../../src/api/index';
import { createFakeDeps } from '../../src/adapters/fake';
import { signToken, verifyToken } from '../../src/lib/token';

function setup() {
  const deps = createFakeDeps();
  const a = express();
  a.use(express.json());
  a.use('/api', createApiRouter(deps));
  return { a, deps };
}

const draft = { origin: { name: '国贸' }, destination: { name: '望京' } };

describe('POST /api/order', () => {
  it('creates an order from a carrier token', async () => {
    const { a, deps } = setup();
    const res = await request(a).post('/api/order').send({ auth: { type: 'carrier', token: 'carrier:13800000000' }, draft });
    expect(res.status).toBe(200);
    expect(res.body.orderId).toMatch(/.+/);
    const q = verifyToken(res.body.queryToken, deps.tokenSecret);
    expect(q?.kind).toBe('query');
    expect(q?.orderId).toBe(res.body.orderId);
    const login = verifyToken(res.body.loginCredential, deps.tokenSecret);
    expect(login?.kind).toBe('login');
  });

  it('creates an order from a magic token carrying the draft', async () => {
    const { a, deps } = setup();
    const magic = signToken({ kind: 'magic', phone: '13800000000', draft }, deps.tokenSecret, 60_000);
    const res = await request(a).post('/api/order').send({ auth: { type: 'magic', token: magic } });
    expect(res.status).toBe(200);
    expect(res.body.orderId).toMatch(/.+/);
  });

  it('rejects an unverified order', async () => {
    const { a } = setup();
    const res = await request(a).post('/api/order').send({ auth: { type: 'carrier', token: 'bad' }, draft });
    expect(res.status).toBe(401);
  });

  it('rejects a draft missing destination', async () => {
    const { a } = setup();
    const res = await request(a)
      .post('/api/order')
      .send({ auth: { type: 'carrier', token: 'carrier:13800000000' }, draft: { origin: { name: '国贸' } } });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/api/order-create.test.ts`
Expected: FAIL（路由未注册）。

- [ ] **Step 3: 实现 order 路由（仅 create）**

Create `src/api/order.ts`:
```ts
import { Router, Request, Response } from 'express';
import { AppDeps } from '../adapters/types';
import { OrderDraft } from '../domain/types';
import { signToken, verifyToken } from '../lib/token';

const QUERY_TTL_MS = 7 * 24 * 60 * 60_000;
const LOGIN_TTL_MS = 365 * 24 * 60 * 60_000;

async function resolveAuth(deps: AppDeps, auth: { type?: string; token?: string }): Promise<{ phone: string; draft?: OrderDraft } | null> {
  const token = String(auth?.token ?? '');
  if (auth?.type === 'carrier') {
    const phone = await deps.carrier.verify(token);
    return phone ? { phone } : null;
  }
  if (auth?.type === 'magic') {
    const p = verifyToken(token, deps.tokenSecret);
    return p && p.kind === 'magic' ? { phone: p.phone, draft: p.draft as OrderDraft } : null;
  }
  if (auth?.type === 'login') {
    const p = verifyToken(token, deps.tokenSecret);
    return p && p.kind === 'login' ? { phone: p.phone } : null;
  }
  return null;
}

export function orderRouter(deps: AppDeps): Router {
  const r = Router();

  r.post('/order', async (req: Request, res: Response) => {
    const resolved = await resolveAuth(deps, req.body?.auth ?? {});
    if (!resolved) return res.status(401).json({ error: 'unverified' });

    const draft: OrderDraft = resolved.draft ?? req.body?.draft ?? {};
    const origin = draft.origin;
    const destination = draft.destination;
    if (!origin?.name || !destination?.name) {
      return res.status(400).json({ error: 'incomplete_draft' });
    }

    const order = await deps.backend.createOrder(resolved.phone, {
      origin,
      destination,
      riderPhone: draft.riderPhone,
      note: draft.note,
    });

    const queryToken = signToken({ kind: 'query', phone: resolved.phone, orderId: order.id }, deps.tokenSecret, QUERY_TTL_MS);
    const loginCredential = signToken({ kind: 'login', phone: resolved.phone }, deps.tokenSecret, LOGIN_TTL_MS);
    return res.json({ orderId: order.id, queryToken, loginCredential });
  });

  return r;
}
```

- [ ] **Step 4: 注册路由**

Modify `src/api/index.ts` — 增加 `import { orderRouter } from './order';` 并加 `r.use(orderRouter(deps));`（放在 verifyRouter 之后）。

- [ ] **Step 5: 运行确认通过**

Run: `npx vitest run tests/api/order-create.test.ts`
Expected: PASS（4 passed）。

- [ ] **Step 6: Commit**

```bash
git add src/api/order.ts src/api/index.ts tests/api/order-create.test.ts
git commit -m "feat(api): POST /api/order（验证后落单）"
```

---

## Task 10: `GET /api/order/:token` + 取消

**Files:**
- Modify: `src/api/order.ts`
- Test: `tests/api/order-status.test.ts`

设计：`GET /api/order/:token` —— `:token` 为 `queryToken`；verify 成功且 `kind:'query'` → 取订单 → 返回 `{ status, timeline, origin, destination, maskedPhone }`；token 无效 → 401。`POST /api/order/:token/cancel` —— verify queryToken → `backend.cancelOrder`；成功 200 `{ cancelled:true }`；不可取消 → 409 `{ error:'not_cancellable', hint:'已接单，请联系司机或拨 95139' }`。`maskedPhone` 形如 `138****8888`。

- [ ] **Step 1: 写失败测试**

Create `tests/api/order-status.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createApiRouter } from '../../src/api/index';
import { createFakeDeps } from '../../src/adapters/fake';

function setup() {
  const deps = createFakeDeps();
  const a = express();
  a.use(express.json());
  a.use('/api', createApiRouter(deps));
  return { a, deps };
}

const draft = { origin: { name: '国贸' }, destination: { name: '望京' } };

async function place(a: express.Express) {
  const res = await request(a).post('/api/order').send({ auth: { type: 'carrier', token: 'carrier:13800008888' }, draft });
  return res.body as { orderId: string; queryToken: string };
}

describe('GET /api/order/:token', () => {
  it('returns status, timeline and masked phone', async () => {
    const { a } = setup();
    const { queryToken } = await place(a);
    const res = await request(a).get(`/api/order/${queryToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('accepted');
    expect(res.body.timeline[0].status).toBe('accepted');
    expect(res.body.destination.name).toBe('望京');
    expect(res.body.maskedPhone).toBe('138****8888');
  });

  it('reflects advanced status', async () => {
    const { a, deps } = setup();
    const { orderId, queryToken } = await place(a);
    deps.backend.store_().advance(orderId, 'calling_driver');
    const res = await request(a).get(`/api/order/${queryToken}`);
    expect(res.body.status).toBe('calling_driver');
  });

  it('rejects an invalid token', async () => {
    const { a } = setup();
    const res = await request(a).get('/api/order/garbage');
    expect(res.status).toBe(401);
  });

  it('cancels before driver assigned', async () => {
    const { a } = setup();
    const { queryToken } = await place(a);
    const res = await request(a).post(`/api/order/${queryToken}/cancel`);
    expect(res.status).toBe(200);
    expect(res.body.cancelled).toBe(true);
  });

  it('refuses cancel after driver assigned', async () => {
    const { a, deps } = setup();
    const { orderId, queryToken } = await place(a);
    deps.backend.store_().advance(orderId, 'driver_assigned');
    const res = await request(a).post(`/api/order/${queryToken}/cancel`);
    expect(res.status).toBe(409);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/api/order-status.test.ts`
Expected: FAIL（GET/cancel 路由未实现，404）。

- [ ] **Step 3: 扩展 order 路由**

Modify `src/api/order.ts` —— 在 `orderRouter` 内、`return r;` 之前追加以下两个路由，并在文件顶部已有的 import 基础上补充 maskPhone 帮助函数（放在 `resolveAuth` 之前）：

新增帮助函数（加在 `resolveAuth` 函数上方）：
```ts
function maskPhone(p: string): string {
  return p.length === 11 ? `${p.slice(0, 3)}****${p.slice(7)}` : p;
}
```

新增路由（加在 `r.post('/order', ...)` 之后、`return r;` 之前）：
```ts
  r.get('/order/:token', async (req: Request, res: Response) => {
    const p = verifyToken(req.params.token, deps.tokenSecret);
    if (!p || p.kind !== 'query' || !p.orderId) return res.status(401).json({ error: 'unauthorized' });
    const order = await deps.backend.getOrder(p.orderId);
    if (!order) return res.status(404).json({ error: 'not_found' });
    return res.json({
      status: order.status,
      timeline: order.timeline,
      origin: order.origin,
      destination: order.destination,
      maskedPhone: maskPhone(order.phone),
    });
  });

  r.post('/order/:token/cancel', async (req: Request, res: Response) => {
    const p = verifyToken(req.params.token, deps.tokenSecret);
    if (!p || p.kind !== 'query' || !p.orderId) return res.status(401).json({ error: 'unauthorized' });
    const ok = await deps.backend.cancelOrder(p.orderId);
    if (!ok) return res.status(409).json({ error: 'not_cancellable', hint: '已接单，请联系司机或拨 95139' });
    return res.json({ cancelled: true });
  });
```

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run tests/api/order-status.test.ts`
Expected: PASS（5 passed）。

- [ ] **Step 5: Commit**

```bash
git add src/api/order.ts tests/api/order-status.test.ts
git commit -m "feat(api): GET /api/order/:token 状态时间线 + 取消"
```

---

## Task 11: 挂载到 server.ts

**Files:**
- Modify: `src/server.ts`
- Create: `src/adapters/index.ts`
- Test: `tests/api/mounted.test.ts`

设计：`src/adapters/index.ts` 暴露 `getDeps()` —— 一期返回 fake（读 `process.env.TOKEN_SECRET || 'dev-secret'`），后续计划据 env 切真实 provider。`server.ts` 在静态资源之前 `app.use(express.json())` 并 `app.use('/api', createApiRouter(getDeps()))`。

- [ ] **Step 1: 写失败测试**

Create `tests/api/mounted.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { getDeps } from '../../src/adapters/index';

describe('deps registry', () => {
  it('provides a full AppDeps set', () => {
    const d = getDeps();
    expect(typeof d.llm.parse).toBe('function');
    expect(typeof d.geo.reverse).toBe('function');
    expect(typeof d.backend.createOrder).toBe('function');
    expect(d.tokenSecret.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/api/mounted.test.ts`
Expected: FAIL（`src/adapters/index` 不存在）。

- [ ] **Step 3: 实现 deps 注册表**

Create `src/adapters/index.ts`:
```ts
import { AppDeps } from './types';
import { createFakeDeps } from './fake';

export function getDeps(): AppDeps {
  // 一期：fake adapter。后续计划据 process.env.PROVIDER_* 切真实 provider。
  return createFakeDeps(process.env.TOKEN_SECRET || 'dev-secret');
}
```

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run tests/api/mounted.test.ts`
Expected: PASS（1 passed）。

- [ ] **Step 5: 挂载到 server.ts**

Modify `src/server.ts` —— 在 import 区加：
```ts
import { createApiRouter } from './api/index';
import { getDeps } from './adapters/index';
```
在 `app.use(compression());` 之后、访问日志中间件之前，加：
```ts
app.use(express.json());
app.use('/api', createApiRouter(getDeps()));
```

- [ ] **Step 6: 全量测试 + 构建**

Run: `npm test && npm run build:server`
Expected: 全部 PASS；`tsc -p tsconfig.json` 无错误。

- [ ] **Step 7: 手工冒烟（可选）**

Run:
```bash
npm run dev &
sleep 2
curl -s -X POST localhost:3000/api/parse -H 'content-type: application/json' -d '{"text":"我在国贸喝多了想去望京SOHO","city":"北京"}'
kill %1
```
Expected: 返回含 `"intent":"ride"` 与 `destination` 的 JSON。

- [ ] **Step 8: Commit**

```bash
git add src/adapters/index.ts src/server.ts tests/api/mounted.test.ts
git commit -m "feat(api): 挂载 BFF /api 到 Express server"
```

---

## 验收

- `npm test` 全绿（token / rateLimit / orderStore / fake adapters / 4 个 API 套件 / 挂载）。
- `npm run build:server` 通过。
- 5 个接口可 curl：`/api/parse` `/api/geo` `/api/verify/send` `/api/order` `/api/order/:token`(+`/cancel`)。
- 全程 fake adapter，无任何真实外部依赖；adapter 接口就位，后续计划替换真实 provider。
