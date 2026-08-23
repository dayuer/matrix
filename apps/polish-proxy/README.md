# polish-proxy

VoiceBridge「AI 润色」云端代理。契约与错误码表：translate 仓 `docs/cloud-polish-api-contract.md`（唯一事实源，本 README 不重复）。

## 本地联调（iOS 端开发用，无需密钥）

```bash
npm install
npm run dev:mock          # MOCK=1,端口 8787
```

- `POST /v1/polish`：`polished` 返回「【mock】原文【mock】」；`text` 传 `__429__`/`__502__`/`__422__` 触发对应错误路径。
- `GET /healthz`：204，预热探测。

## 真实上游(含备用降级)

主上游网络失败/5xx 自动单次降级备用(DeepSeek 官方 flash,thinking 关):

```bash
UPSTREAM_BASE_URL=... UPSTREAM_API_KEY=... \
FALLBACK_BASE_URL=https://api.deepseek.com FALLBACK_API_KEY=... npm run dev
```

## 仅主上游

```bash
ANTHROPIC_API_KEY=... POLISH_MODEL=claude-opus-5 npm run dev
```

## 部署（后议，未定稿）

按 matrix 惯例走 `packages/site-kit/deploy/deploy.template.sh` 的 VPS+SSL 模板即可承载；域名、进程管理与密钥注入方式待部署轮拍板。

## 上线前硬前置（勿忘）

- **App Attest 验签未实现**（`verifyAssertion` 恒真，只做存在性检查）。当前盗刷上限靠单设备 60 次/时 + 日预算熔断兜底；对外开放前必须补齐 attestation 注册 + assertion 验签。已在 voicebridge issue #3 记账。
- `POLISH_MODEL` 终值待盲评定档（opus-5 vs haiku-4-5）。
