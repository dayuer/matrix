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
