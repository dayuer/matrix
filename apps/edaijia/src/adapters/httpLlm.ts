/**
 * httpLlm.ts — 真实 LLM 解析适配器（OpenAI 兼容 Chat Completions）
 *
 * 职责：把用户自然语言（含语音转写）交给 LLM，结构化为 ParseResult。
 * 兼容任意 OpenAI 风格 `/chat/completions` 端点（OpenAI / 智谱 / DeepSeek / 自建网关）。
 *
 * 启用：LLM_PROVIDER=http
 *   LLM_API_URL   必填，chat completions 地址
 *   LLM_API_KEY   必填，Bearer key
 *   LLM_MODEL     可选，默认 'DeepSeek-R1'
 *
 * 流式输出：parseStream() 通过 SSE stream=true 模式逐 token 推送，
 *   支持 DeepSeek-R1 的 reasoning_content（思考过程）与 content（正文）分离。
 *
 * 容错：任何网络 / 解析 / 校验失败 → 委托注入的 fallback（正则 fakeLlm），
 * 保证「AI 不可用绝不卡死真实客户」（PRD §4 Step 5）。
 */
import { LlmAdapter, StreamChunk } from './types';
import { ParseResult, OrderDraft, MissingField } from '../domain/types';

const SYSTEM_PROMPT = `你是 e代驾「出行助手」。把用户的一句话解析成叫代驾订单。
只认两要素：起点(origin) 和 终点(destination)。
回复格式要求：先用自然语言简短回复用户（1-2句话），然后在最后附上JSON块。
JSON块必须用 \`\`\`json 和 \`\`\` 包裹，字段：
{
  "intent": "ride" | "other",
  "card": { "origin": {"name": string} | null, "destination": {"name": string} | null },
  "missing": ("origin"|"destination")[],
  "ask": string | null,
  "confidence": number,
  "futureTimeDetected": boolean
}
约束：
- 城市上下文为「{{CITY}}」，起终点尽量收敛到该城内
- 识别到跨城/送回老家/到外地机场时终点可放开城市范围
- 非叫代驾需求（代检车/拖车/洗车/保养等）intent="other"
- "ask"是缺项时的一句话追问，一次只问一项
- "futureTimeDetected"：是否含未来时间/预约意图（明天/几点/下周/X小时后）
- 自然语言部分要友好亲切，像真人客服`;

interface ChatResponse {
  choices?: { message?: { content?: string } }[];
}

export class HttpLlmAdapter implements LlmAdapter {
  private url: string;
  private key: string;
  private model: string;

  constructor(
    private fallback: LlmAdapter,
    url = process.env.LLM_API_URL,
    key = process.env.LLM_API_KEY,
    model = process.env.LLM_MODEL || 'DeepSeek-R1',
  ) {
    if (!url || !key) throw new Error('HttpLlmAdapter 需要 LLM_API_URL 与 LLM_API_KEY');
    this.url = url;
    this.key = key;
    this.model = model;
  }

  /** 非流式解析（兼容旧路径） */
  async parse(text: string, city: string): Promise<ParseResult> {
    try {
      const resp = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.key}`,
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.3,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT.replace('{{CITY}}', city || '未知') },
            { role: 'user', content: text },
          ],
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!resp.ok) throw new Error(`LLM HTTP ${resp.status}`);

      const data = (await resp.json()) as ChatResponse;
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('LLM 空响应');

      return extractParseResultStrict(content);
    } catch (err) {
      console.warn('[LLM] 非流式解析失败，降级正则解析器:', (err as Error).message);
      return this.fallback.parse(text, city);
    }
  }

  /** 流式解析：SSE stream=true，逐 token 回调，最终返回完整 ParseResult */
  async parseStream(
    text: string,
    city: string,
    onChunk: (chunk: StreamChunk) => void,
  ): Promise<ParseResult> {
    try {
      const resp = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.key}`,
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.3,
          stream: true,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT.replace('{{CITY}}', city || '未知') },
            { role: 'user', content: text },
          ],
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!resp.ok) throw new Error(`LLM SSE HTTP ${resp.status}`);
      if (!resp.body) throw new Error('LLM SSE 无 body');

      let fullContent = '';
      let fullReasoning = '';
      let inThinking = false;

      // 手动解析 SSE 字节流
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // 按行切分 SSE 事件
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 最后一段可能不完整，留到下次

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          const jsonStr = trimmed.slice(6);
          try {
            const event = JSON.parse(jsonStr) as {
              choices?: {
                delta?: {
                  content?: string;
                  reasoning_content?: string;
                };
              }[];
            };

            const delta = event.choices?.[0]?.delta;
            if (!delta) continue;

            // DeepSeek-R1 的思考过程走 reasoning_content 字段
            if (delta.reasoning_content) {
              fullReasoning += delta.reasoning_content;
              onChunk({ delta: delta.reasoning_content, thinking: true });
            }

            // 正文内容
            if (delta.content) {
              const chunk = delta.content;
              fullContent += chunk;

              // 处理 <think>...</think> 标签（某些模型用标签而非独立字段）
              if (chunk.includes('<think>')) {
                inThinking = true;
                const before = chunk.split('<think>')[0];
                if (before) onChunk({ delta: before });
                const after = chunk.split('<think>')[1] || '';
                if (after && !after.includes('</think>')) {
                  onChunk({ delta: after, thinking: true });
                }
              } else if (chunk.includes('</think>')) {
                inThinking = false;
                const after = chunk.split('</think>')[1] || '';
                if (after) onChunk({ delta: after });
              } else {
                onChunk({ delta: chunk, thinking: inThinking });
              }
            }
          } catch {
            // 单个 SSE 行 JSON 解析失败：跳过，不中断流
          }
        }
      }

      // 流结束：从聚合内容中提取结构化结果
      // 清理 <think>...</think> 标签后提取
      const cleanContent = fullContent
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .trim();

      return extractParseResult(cleanContent);
    } catch (err) {
      console.warn('[LLM] 流式解析失败，降级正则解析器:', (err as Error).message);
      return this.fallback.parse(text, city);
    }
  }
}

/**
 * 严格版本：从 LLM 回复中提取 ParseResult，找不到 JSON 则抛异常。
 * 用于非流式 parse()，抛异常后触发 fallback 降级。
 */
function extractParseResultStrict(content: string): ParseResult {
  // 优先匹配 ```json ... ``` 代码块
  const codeBlockMatch = content.match(/```json\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return normalize(JSON.parse(codeBlockMatch[1].trim()));
  }

  // 其次直接尝试整段 JSON.parse
  try {
    return normalize(JSON.parse(content));
  } catch { /* 继续尝试 */ }

  // 再次匹配裸 JSON 对象
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return normalize(JSON.parse(jsonMatch[0]));
  }

  throw new Error('LLM 回复中无有效 JSON');
}

/**
 * 宽容版本：从 LLM 回复中提取 ParseResult。
 * 先尝试找 ```json ... ``` 代码块，再尝试找裸 JSON 对象。
 * 找不到时返回默认缺失结果（流式场景下自然语言回复本身有价值，不抛异常）。
 */
function extractParseResult(content: string): ParseResult {
  // 优先匹配 ```json ... ``` 代码块
  const codeBlockMatch = content.match(/```json\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return normalize(JSON.parse(codeBlockMatch[1].trim()));
  }

  // 其次匹配裸 JSON 对象（花括号开头结尾）
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return normalize(JSON.parse(jsonMatch[0]));
  }

  // 无结构化输出：当作纯对话回复，缺失全部要素
  return {
    intent: 'ride',
    card: {},
    missing: ['origin', 'destination'],
    ask: content.slice(0, 100) || '你在哪？要去哪？',
    confidence: 0.3,
    futureTimeDetected: false,
  };
}

/** 把 LLM 的自由 JSON 收敛成严格 ParseResult，缺字段补默认值 */
function normalize(raw: unknown): ParseResult {
  const o = (raw ?? {}) as Record<string, unknown>;
  const rawCard = (o.card ?? {}) as Record<string, unknown>;
  const pickPlace = (v: unknown): { name: string } | undefined => {
    const name = (v as { name?: unknown })?.name;
    return typeof name === 'string' && name.trim() ? { name: name.trim() } : undefined;
  };
  const card: OrderDraft = {
    origin: pickPlace(rawCard.origin),
    destination: pickPlace(rawCard.destination),
  };
  const missing: MissingField[] = [];
  if (!card.origin) missing.push('origin');
  if (!card.destination) missing.push('destination');

  const intent = o.intent === 'other' ? 'other' : 'ride';
  const ask =
    typeof o.ask === 'string' && o.ask.trim()
      ? o.ask.trim()
      : missing[0] === 'destination'
        ? '要去哪？'
        : missing[0] === 'origin'
          ? '你在哪？'
          : undefined;

  return {
    intent,
    card: intent === 'other' ? {} : card,
    missing: intent === 'other' ? [] : missing,
    ask: intent === 'other' ? undefined : ask,
    confidence: typeof o.confidence === 'number' ? o.confidence : missing.length ? 0.5 : 0.8,
    futureTimeDetected: o.futureTimeDetected === true,
  };
}
