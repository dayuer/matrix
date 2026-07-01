import { Router, Request, Response } from 'express';
import { AppDeps, StreamChunk } from '../adapters/types';
import { RateLimiter } from '../lib/rateLimit';

export function parseRouter(deps: AppDeps): Router {
  const r = Router();
  // 按 IP 限频，挡住刷对话烧 LLM（PRD §8）。30 次 / 分钟。
  const limiter = new RateLimiter(30, 60_000);

  /** 非流式：一次性返回完整 JSON（向下兼容） */
  r.post('/parse', async (req: Request, res: Response) => {
    if (!limiter.hit(req.ip || 'unknown')) {
      return res.status(429).json({ error: 'too_many', fallback: 'manual' });
    }
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const city = String(req.body?.city ?? '');
    if (!text) return res.status(400).json({ error: 'empty_text' });
    const result = await deps.llm.parse(text, city);
    return res.json(result);
  });

  /**
   * 流式 SSE：逐 token 推送 LLM 回复，客户端通过 EventSource 或 fetch+ReadableStream 消费。
   *
   * 事件类型：
   *   event: chunk    data: { delta: "...", thinking?: boolean }
   *   event: result   data: ParseResult（完整结构化解析结果）
   *   event: error    data: { error: "..." }
   *
   * 降级：如果 LLM 适配器不支持 parseStream，则直接调用非流式 parse 并以单次 result 事件返回。
   */
  r.post('/parse/stream', async (req: Request, res: Response) => {
    if (!limiter.hit(req.ip || 'unknown')) {
      return res.status(429).json({ error: 'too_many', fallback: 'manual' });
    }
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const city = String(req.body?.city ?? '');
    if (!text) return res.status(400).json({ error: 'empty_text' });

    // SSE 头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // nginx 代理不缓冲
    res.flushHeaders();

    // 客户端断开时清理
    let aborted = false;
    req.on('close', () => { aborted = true; });

    const sendSSE = (event: string, data: unknown): void => {
      if (aborted) return;
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      if (deps.llm.parseStream) {
        // 有流式能力：逐 chunk 推送
        const result = await deps.llm.parseStream(text, city, (chunk: StreamChunk) => {
          sendSSE('chunk', chunk);
        });
        sendSSE('result', result);
      } else {
        // 无流式能力：降级为非流式，一次性推送结果
        const result = await deps.llm.parse(text, city);
        sendSSE('result', result);
      }
    } catch (err) {
      sendSSE('error', { error: (err as Error).message });
    }

    if (!aborted) res.end();
  });

  return r;
}
