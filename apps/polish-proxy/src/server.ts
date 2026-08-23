// VoiceBridge 云端润色代理 — 契约:translate 仓 docs/cloud-polish-api-contract.md
//
// 三件事:持钥转发、单设备限速、(预留)App Attest 校验。行为承诺:
// 零留存 —— 请求/响应正文不落盘不入日志;访问日志只记 时间戳/设备key哈希前8位/状态/文本长度/耗时。
// App Attest 验签未实现(接口预留,见 verifyAssertion):上线对外前必须补齐 —— issue voicebridge#3 记账。

import crypto from "node:crypto";
import express from "express";

const PORT = Number(process.env.PORT ?? 8787);
// 上游:OpenAI 兼容中转(2026-08-23 评测定档,见 translate 仓 specs/2026-08-23-cloud-polish-model-eval.md)
// gpt-4o-mini: 12模型两轮实测 50/50 成功、p50 1.5s、$0.00007/次、规则遵从度最佳
const MODEL = process.env.POLISH_MODEL ?? "gpt-4o-mini";
const UPSTREAM_BASE = process.env.UPSTREAM_BASE_URL ?? "";
const UPSTREAM_KEY = process.env.UPSTREAM_API_KEY ?? "";
// 备用上游(2026-08-23 评测拍板):DeepSeek 官方 flash,主上游挂掉时单次降级重试。
// 质量 13/13 与主档打平、忠实度好;成本上限约主档 5-10 倍,仅故障窗口内发生。
const FALLBACK_BASE = process.env.FALLBACK_BASE_URL ?? "";
const FALLBACK_KEY = process.env.FALLBACK_API_KEY ?? "";
const FALLBACK_MODEL = process.env.FALLBACK_MODEL ?? "deepseek-v4-flash";
const DAILY_BUDGET_CALLS = Number(process.env.DAILY_BUDGET_CALLS ?? 5000);
const MOCK = process.env.MOCK === "1";
/** 单设备滑动窗限速:60 次/小时(验签补齐前的盗刷上限由它 + 日预算熔断兜底) */
const DEVICE_LIMIT_PER_HOUR = 60;

// ---------- 保守修正 prompt(spec §3.3 三段式;固化在代理侧,客户端不可注入指令) ----------

const SYSTEM_PROMPT = `你是会议逐字稿的校对助手。输入是一段语音识别(ASR)转写文本,你只修 ASR 识别层面的错误,绝不改写说话人的话。

只修以下五类:
1. 同音/近音误识(如「在座」被识别成「再做」);
2. 专有名词与术语的正确写法(如 github → GitHub);
3. 数字与日期格式;
4. 标点与断句(把连排的长句按语义断开);
5. 口吃性重复(「我我我觉得」→「我觉得」)。

以下一律不动:
- 语气词(嗯、呃、就是说)——逐字稿属性,保留;
- 说话人的自我更正(「周一,不对,周二」原样保留);
- 说话人的语法习惯与方言表达;
- 强调性重复;
- 用词与句式选择。

无法判断是识别错误还是说话人本意时,一律不改。只输出修正后的文本,不加任何解释、前缀或引号。`;

// ---------- 限速与熔断(内存态;进程重启即清零,可接受 —— 账本在客户端) ----------

/** keyID → 最近一小时内的请求时间戳 */
const deviceWindows = new Map<string, number[]>();
let dailyCount = 0;
let dailyDate = new Date().toDateString();

function rateLimited(deviceKey: string): boolean {
  const now = Date.now();
  const win = (deviceWindows.get(deviceKey) ?? []).filter((t) => now - t < 3600_000);
  if (win.length >= DEVICE_LIMIT_PER_HOUR) {
    deviceWindows.set(deviceKey, win);
    return true;
  }
  win.push(now);
  deviceWindows.set(deviceKey, win);
  // 防泄漏:窗口表只保留最近活跃设备
  if (deviceWindows.size > 10_000) {
    for (const [k, v] of deviceWindows) {
      if (v.every((t) => now - t >= 3600_000)) deviceWindows.delete(k);
    }
  }
  return false;
}

function overDailyBudget(): boolean {
  const today = new Date().toDateString();
  if (today !== dailyDate) {
    dailyDate = today;
    dailyCount = 0;
  }
  dailyCount += 1;
  return dailyCount > DAILY_BUDGET_CALLS;
}

// ---------- App Attest(预留) ----------

/**
 * 断言验签 —— 未实现。当前只校验存在性;密码学验证(attestation 注册 + assertion
 * 计数器)是上线对外前的硬前置,接口签名按未来实现预留。
 */
function verifyAssertion(_deviceKey: string, _assertion: string, _body: Buffer): boolean {
  return true;
}

// ---------- 服务 ----------

const app = express();
app.use(express.json({ limit: "32kb" }));

app.get("/healthz", (_req, res) => {
  res.status(204).end();
});

app.post("/v1/polish", async (req, res) => {
  const started = Date.now();
  const deviceKey = String(req.header("X-Device-Key") ?? "");
  const assertion = String(req.header("X-App-Attest-Assertion") ?? "");
  const keyDigest = crypto.createHash("sha256").update(deviceKey).digest("hex").slice(0, 8);

  /** 零留存日志:绝不包含正文 */
  const logLine = (status: number, len: number) =>
    console.log(`${new Date().toISOString()} ${keyDigest} ${status} len=${len} ${Date.now() - started}ms`);

  const text = typeof req.body?.text === "string" ? req.body.text : "";
  const langHint = typeof req.body?.lang_hint === "string" ? req.body.lang_hint : "";
  const trimmed = text.trim();
  // 长度复核与客户端否决闸门同口径:按「去除所有空白后的字符数」计。
  // 口径不一致会造成「客户端放行、代理 400」缝隙(2026-08-23 Task 4 规格审查发现)。
  const effectiveLength = [...text].filter((c) => !/\s/.test(c)).length;

  if (!deviceKey || !assertion || !verifyAssertion(deviceKey, assertion, Buffer.from(text))) {
    logLine(401, trimmed.length);
    return res.status(401).json({ error: "attest_failed" });
  }
  if (effectiveLength < 5 || effectiveLength > 2000) {
    logLine(400, effectiveLength);
    return res.status(400).json({ error: "text_invalid" });
  }
  if (rateLimited(deviceKey)) {
    logLine(429, trimmed.length);
    return res.status(429).json({ error: "rate_limited" });
  }
  if (overDailyBudget()) {
    logLine(503, trimmed.length);
    return res.status(503).json({ error: "over_budget" });
  }

  if (MOCK) {
    // 本地联调:魔法值触发错误路径,其余返回确定性变换
    const magic: Record<string, [number, string]> = {
      __429__: [429, "rate_limited"],
      __502__: [502, "upstream_error"],
      __422__: [422, "content_declined"],
    };
    const hit = magic[trimmed];
    if (hit) {
      logLine(hit[0], trimmed.length);
      return res.status(hit[0]).json({ error: hit[1] });
    }
    logLine(200, trimmed.length);
    return res.json({ polished: `【mock】${trimmed}【mock】` });
  }

  try {
    const hintLine = langHint ? `\n(提示:这段以${langHint === "en" ? "英文" : langHint === "mixed" ? "中英混说" : "中文"}为主)` : "";
    const callUpstream = (base: string, key: string, model: string, extra: object) =>
      fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: trimmed + hintLine },
          ],
          max_tokens: 4000,
          temperature: 0,
          ...extra,
        }),
        signal: AbortSignal.timeout(30_000),
      });
    let upstream = await callUpstream(UPSTREAM_BASE, UPSTREAM_KEY, MODEL, {}).catch(() => null);
    // 主上游网络失败或 5xx → 备用上游单次降级(4xx 不降级:内容/参数问题换上游无意义)。
    // DeepSeek thinking 默认开启,备用调用显式关闭(拍板:不开 think)。
    if ((!upstream || upstream.status >= 500) && FALLBACK_BASE && FALLBACK_KEY) {
      upstream = await callUpstream(FALLBACK_BASE, FALLBACK_KEY, FALLBACK_MODEL,
        { thinking: { type: "disabled" } }).catch(() => null);
    }
    if (!upstream) {
      logLine(502, trimmed.length);
      return res.status(502).json({ error: "upstream_error" });
    }
    if (!upstream.ok) {
      // 上游内容过滤(400/422 带 content_filter 等)统一归 content_declined,其余 upstream_error
      logLine(upstream.status === 400 || upstream.status === 422 ? 422 : 502, trimmed.length);
      return res
        .status(upstream.status === 400 || upstream.status === 422 ? 422 : 502)
        .json({ error: upstream.status === 400 || upstream.status === 422 ? "content_declined" : "upstream_error" });
    }
    const data = (await upstream.json()) as { choices?: { message?: { content?: string } }[] };
    const polished = (data.choices?.[0]?.message?.content ?? "").trim();
    if (!polished) {
      logLine(502, trimmed.length);
      return res.status(502).json({ error: "upstream_error" });
    }
    logLine(200, trimmed.length);
    return res.json({ polished });
  } catch {
    // 错误对象可能含请求上下文,零留存起见不打印内容,只记状态
    logLine(502, trimmed.length);
    return res.status(502).json({ error: "upstream_error" });
  }
});

app.listen(PORT, () => {
  console.log(`polish-proxy :${PORT} model=${MODEL} mock=${MOCK} budget=${DAILY_BUDGET_CALLS}/day`);
});
