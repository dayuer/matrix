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

const SYSTEM_PROMPT = `你是会议逐字稿的编辑。用户消息包含:【词汇表】(可选,人名/产品名/公司名的正确写法)、【本段】(待整理的连续 ASR 转写文本)。你的任务:在不改变说话人原意的前提下,把【本段】整理成干净、可读、前后通顺的逐字稿。

关于输入的重要背景:ASR 按固定时长切块,会在句子中间**误插入句号**,把一句话、甚至一个数字劈成两半(如「每年的预算也是从4。4000万提升到快一个亿」实为「每年的预算也是从4000万提升到快一个亿」)。遇到这种伪断句必须识别并缝合。

必须做:
1. 修正同音/近音误识的错别字——结合上下文大胆判断(如「再做」应为「在座」、「家里GPT」应为「ChatGPT」);【词汇表】中的词出现同音/近音误识时一律改为表内写法,且**必须逐字精确使用表内写法**(表内是「度晓保」就绝不能写成「杜晓保」);
2. 缝合被误插句号劈开的句子和数字;
3. 删除无信息量的填充语气词:呃、嗯、啊、哎、哦等,以及重复的口头禅填充(连续的「这个这个」「就是就是」删到只剩必要的一次或全删);
4. 删除口吃性重复(「我我我觉得」→「我觉得」);
5. 修正标点与断句,把连排的长句按语义断开;
6. 专有名词、术语、数字、日期写法规范化。

不许做:
- 允许**最小限度**理顺口语碎片:删除冗余的口头残片(如「我想希望就是这个能够」→「我希望」)、理顺被打断的语序,使句子通顺;但不得书面化改写、不概括压缩、不增删任何实义内容、不替换实义用词;
- 【本段】结尾若句子被切断,保持截断处原样,**绝不猜测补词**;
- 词汇表仅用于纠错,不得强行插入;
- 保留说话人的自我更正(「周一,不对,周二」原样保留);
- 有实际语气功能的词保留(真正的疑问、感叹不删)。

只输出【本段】的整理稿,不加任何解释、前缀或引号。
`;
// ↑ 提示词 v5.1 单段版(2026-08-23 固化):碎片理顺+清语气词+伪断句缝合+词汇表数据通道。
// 演进必须过 translate 仓 scripts/bench 回归断言集(13条)后方可替换 —— v3 回退事故的防线。

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
  const glossary: string[] = Array.isArray(req.body?.glossary)
    ? req.body.glossary.filter((g: unknown) => typeof g === "string" && g.length <= 20).slice(0, 50)
    : [];
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
            { role: "user", content: (glossary.length ? `【词汇表】${glossary.join("、")}\n` : "") + `【本段】${trimmed}` + hintLine },
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
