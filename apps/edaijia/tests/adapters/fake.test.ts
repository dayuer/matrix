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
