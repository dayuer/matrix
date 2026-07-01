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
