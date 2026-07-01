import { describe, it, expect, afterEach } from 'vitest';
import { rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { OrderStore } from '../../src/domain/orderStore';

const file = join(tmpdir(), `edj-orders-${process.pid}-${Date.now()}.json`);
const origin = { name: '国贸' };
const dest = { name: '望京' };

afterEach(() => {
  try { rmSync(file); } catch { /* noop */ }
});

describe('OrderStore file persistence', () => {
  it('reloads orders from disk in a fresh instance', () => {
    const s1 = new OrderStore({ file });
    const o = s1.create('13800008888', origin, dest);

    const s2 = new OrderStore({ file });
    const reloaded = s2.get(o.id);
    expect(reloaded?.id).toBe(o.id);
    expect(reloaded?.destination.name).toBe('望京');
    expect(reloaded?.status).toBe('accepted');
  });

  it('persists status advances across instances', () => {
    const s1 = new OrderStore({ file });
    const o = s1.create('13800008888', origin, dest);
    s1.advance(o.id, 'calling_driver');

    const s2 = new OrderStore({ file });
    expect(s2.get(o.id)?.status).toBe('calling_driver');
  });

  it('stays purely in-memory when no file is given', () => {
    const s = new OrderStore();
    const o = s.create('13800008888', origin, dest);
    expect(s.get(o.id)?.id).toBe(o.id);
    // 无文件 → 新实例互不可见
    expect(new OrderStore().get(o.id)).toBeUndefined();
  });
});
