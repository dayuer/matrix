import { describe, it, expect, vi, afterEach } from 'vitest';
import { HttpLlmAdapter } from '../../src/adapters/httpLlm';
import { LlmAdapter } from '../../src/adapters/types';
import { ParseResult } from '../../src/domain/types';

const fallbackResult: ParseResult = {
  intent: 'ride',
  card: { origin: { name: 'FALLBACK起点' }, destination: { name: 'FALLBACK终点' } },
  missing: [],
  confidence: 0.8,
  futureTimeDetected: false,
};
const fallback: LlmAdapter = { parse: async () => fallbackResult };

function mockChat(content: string) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ choices: [{ message: { content } }] }),
  } as unknown as Response);
}

afterEach(() => vi.restoreAllMocks());

describe('HttpLlmAdapter', () => {
  it('normalizes a well-formed LLM JSON response', async () => {
    vi.stubGlobal('fetch', mockChat(JSON.stringify({
      intent: 'ride',
      card: { origin: { name: '国贸' }, destination: { name: '望京SOHO' } },
      missing: [],
      ask: null,
      confidence: 0.95,
      futureTimeDetected: false,
    })));
    const llm = new HttpLlmAdapter(fallback, 'http://x', 'k');
    const r = await llm.parse('我在国贸想去望京SOHO', '北京');
    expect(r.intent).toBe('ride');
    expect(r.card.destination?.name).toBe('望京SOHO');
    expect(r.missing).toHaveLength(0);
  });

  it('derives missing + ask when the LLM omits a field', async () => {
    vi.stubGlobal('fetch', mockChat(JSON.stringify({
      intent: 'ride',
      card: { origin: { name: '国贸' }, destination: null },
      confidence: 0.5,
      futureTimeDetected: false,
    })));
    const llm = new HttpLlmAdapter(fallback, 'http://x', 'k');
    const r = await llm.parse('我在国贸喝多了', '北京');
    expect(r.missing).toContain('destination');
    expect(r.ask).toBe('要去哪？');
  });

  it('falls back to the injected parser on HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response));
    const llm = new HttpLlmAdapter(fallback, 'http://x', 'k');
    const r = await llm.parse('anything', '北京');
    expect(r.card.origin?.name).toBe('FALLBACK起点');
  });

  it('falls back on malformed JSON content', async () => {
    vi.stubGlobal('fetch', mockChat('not json at all'));
    const llm = new HttpLlmAdapter(fallback, 'http://x', 'k');
    const r = await llm.parse('anything', '北京');
    expect(r.card.destination?.name).toBe('FALLBACK终点');
  });

  it('throws when constructed without url/key', () => {
    expect(() => new HttpLlmAdapter(fallback, '', '')).toThrow();
  });
});
