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
