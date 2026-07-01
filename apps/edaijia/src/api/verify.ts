import { Router, Request, Response } from 'express';
import { AppDeps } from '../adapters/types';
import { signToken, verifyToken, TokenPayload } from '../lib/token';
import { RateLimiter } from '../lib/rateLimit';
import { OrderDraft } from '../domain/types';

const PHONE_RE = /^1\d{10}$/;
const MAGIC_TTL_MS = 5 * 60_000; // 5 分钟（审计建议从 10 分钟缩短）
const QUERY_TTL_MS = 7 * 24 * 60 * 60_000;
const LOGIN_TTL_MS = 365 * 24 * 60 * 60_000;

/**
 * 验证会话存储（内存级，生产需替换为 Redis）
 *
 * 职责：
 * 1. 绑定 sessionId ↔ magic token（用于跨浏览器同步）
 * 2. 记录 token 一次性消费状态（Single-use，防重放）
 * 3. 存储验证通过后的登录凭证，供原浏览器轮询取回
 */
interface VerifySession {
  phone: string;
  draft: OrderDraft;
  magicToken: string;
  verified: boolean;
  /** 验证通过后由激活端点写入，供原浏览器轮询取回 */
  result?: {
    orderId: string;
    queryToken: string;
    loginCredential: string;
  };
  createdAt: number;
}

export class VerifySessionStore {
  private sessions = new Map<string, VerifySession>();
  private consumed = new Set<string>(); // 已消费的 magic token 签名

  create(sessionId: string, phone: string, draft: OrderDraft, magicToken: string): void {
    this.sessions.set(sessionId, {
      phone,
      draft,
      magicToken,
      verified: false,
      createdAt: Date.now(),
    });
  }

  get(sessionId: string): VerifySession | undefined {
    return this.sessions.get(sessionId);
  }

  /** 标记 token 已消费（Single-use），返回 false 说明已被消费过 */
  consumeToken(tokenSig: string): boolean {
    if (this.consumed.has(tokenSig)) return false;
    this.consumed.add(tokenSig);
    return true;
  }

  markVerified(sessionId: string, result: VerifySession['result']): boolean {
    const s = this.sessions.get(sessionId);
    if (!s) return false;
    s.verified = true;
    s.result = result;
    return true;
  }

  /** 定期清理过期会话（应由外部定时器调用） */
  cleanup(maxAgeMs = 30 * 60_000): void {
    const now = Date.now();
    for (const [id, s] of this.sessions) {
      if (now - s.createdAt > maxAgeMs) this.sessions.delete(id);
    }
  }
}

export function verifyRouter(deps: AppDeps): Router {
  const r = Router();
  const limiter = new RateLimiter(5, 60 * 60_000);
  const base = process.env.MAGIC_LINK_BASE || 'https://m.edaijia.local';
  const store = new VerifySessionStore();

  // 每 10 分钟清理过期会话，防止内存泄漏
  setInterval(() => store.cleanup(), 10 * 60_000).unref();

  /**
   * POST /api/verify/send
   * 发送验证短信（Magic Link）
   *
   * 入参：{ phone, draft, sessionId }
   *   - sessionId 由客户端生成，用于跨浏览器同步
   * 出参：{ sent: true }
   *   - 安全修复：不再返回 linkToken（防止短路 SMS 验证模型）
   */
  r.post('/verify/send', async (req: Request, res: Response) => {
    const phone = String(req.body?.phone ?? '');
    const draft = req.body?.draft ?? {};
    const sessionId = String(req.body?.sessionId ?? '');
    if (!PHONE_RE.test(phone)) return res.status(400).json({ error: 'bad_phone' });
    if (!sessionId) return res.status(400).json({ error: 'missing_session_id' });
    if (!limiter.hit(phone)) return res.status(429).json({ error: 'too_many', fallback: 'manual_callback' });

    const linkToken = signToken({ kind: 'magic', phone, draft, sessionId }, deps.tokenSecret, MAGIC_TTL_MS);
    const link = `${base}/api/verify/click?t=${linkToken}`;

    // 真实短信网关可能抛错（鉴权失败 / 上游超时）；不让它 500，
    // 降级为「留号人工回拨」出口（PRD §4 守住最后一米）。
    try {
      await deps.sms.send(phone, `【e代驾】点击完成下单：${link}`);
    } catch (err) {
      console.error('[verify] 短信发送失败，降级人工回拨:', (err as Error).message);
      return res.status(502).json({ sent: false, fallback: 'manual_callback' });
    }

    // 绑定 sessionId ↔ token，供轮询和激活时查询
    store.create(sessionId, phone, draft, linkToken);

    // 🔒 安全修复：不返回 linkToken，仅通过 SMS 送达
    return res.json({ sent: true });
  });

  /**
   * GET /api/verify/click?t=xxx
   * Magic Link 激活端点（系统浏览器打开）
   *
   * 流程：
   * 1. 验证 token 签名与有效期
   * 2. 一次性消费（Single-use），防重放
   * 3. 创建订单
   * 4. 将结果写入 session，供原浏览器轮询取回
   * 5. 返回确认页
   */
  r.get('/verify/click', async (req: Request, res: Response) => {
    const t = String(req.query?.t ?? '');
    if (!t) return res.status(400).json({ error: 'missing_token' });

    const payload = verifyToken(t, deps.tokenSecret) as (TokenPayload & { sessionId?: string }) | null;
    if (!payload || payload.kind !== 'magic') {
      return res.status(401).json({ error: 'invalid_or_expired', message: '链接已失效或过期，请返回重新发送' });
    }

    // Single-use：提取签名部分作为消费标记
    const tokenSig = t.slice(t.lastIndexOf('.') + 1);
    if (!store.consumeToken(tokenSig)) {
      return res.status(409).json({ error: 'already_used', message: '此链接已使用过' });
    }

    // 提取数据
    const phone = payload.phone;
    const draft = payload.draft as OrderDraft;
    const sessionId = payload.sessionId;

    if (!draft?.origin?.name || !draft?.destination?.name) {
      return res.status(400).json({ error: 'incomplete_draft', message: '订单信息不完整，请返回重新填写' });
    }

    // 创建订单
    const order = await deps.backend.createOrder(phone, {
      origin: draft.origin,
      destination: draft.destination,
      riderPhone: draft.riderPhone,
      note: draft.note,
    });

    const queryToken = signToken({ kind: 'query', phone, orderId: order.id }, deps.tokenSecret, QUERY_TTL_MS);
    const loginCredential = signToken({ kind: 'login', phone }, deps.tokenSecret, LOGIN_TTL_MS);

    // 写入 session 供原浏览器轮询取回
    if (sessionId) {
      store.markVerified(sessionId, { orderId: order.id, queryToken, loginCredential });
    }

    // 真实浏览器（短信里点开的系统浏览器）→ 直接重定向到状态页，
    // 满足 PRD「点开即在该环境渲染状态页」。API / 测试调用（无 Accept: text/html）走 JSON。
    const wantsHtml = String(req.headers.accept ?? '').includes('text/html');
    if (wantsHtml) {
      return res.redirect(302, `/order/status/${queryToken}`);
    }

    // 返回验证成功页（JSON 响应，前端 / SSR 可据此渲染）
    return res.json({
      verified: true,
      orderId: order.id,
      queryToken,
      loginCredential,
      message: '验证成功！请返回原页面查看订单状态。',
    });
  });

  /**
   * GET /api/verify/poll?sessionId=xxx
   * 验证状态轮询端点（原浏览器/微信端轮询）
   *
   * 返回：
   * - 未验证：{ verified: false }
   * - 已验证：{ verified: true, orderId, queryToken, loginCredential }
   */
  r.get('/verify/poll', (req: Request, res: Response) => {
    const sessionId = String(req.query?.sessionId ?? '');
    if (!sessionId) return res.status(400).json({ error: 'missing_session_id' });

    const session = store.get(sessionId);
    if (!session) return res.json({ verified: false });

    if (session.verified && session.result) {
      return res.json({
        verified: true,
        ...session.result,
      });
    }

    return res.json({ verified: false });
  });

  return r;
}

/** 测试用：导出 VerifySessionStore 类 */
export { VerifySession };
