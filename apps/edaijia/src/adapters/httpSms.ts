/**
 * httpSms.ts — 真实短信网关适配器（HTTP 通用网关）
 *
 * 职责：把验证短信（含 magic link）POST 到一个 HTTP 短信网关。
 * 网关地址 / 鉴权从环境变量读取，便于对接阿里云、腾讯云或自建短信中台
 * （任意接受 `{ phone, text }` JSON 的端点）。
 *
 * 启用：SMS_PROVIDER=http
 *   SMS_GATEWAY_URL   必填，短信网关接收地址
 *   SMS_GATEWAY_TOKEN 可选，作为 Bearer 鉴权头
 *
 * 失败处理：抛错由调用方（/api/verify/send）捕获并降级「留号人工回拨」，
 * 不静默吞掉——短信发不出去必须让用户走兜底，而不是以为已发出。
 */
import { SmsAdapter } from './types';

export class HttpSmsAdapter implements SmsAdapter {
  private url: string;
  private token?: string;

  constructor(url = process.env.SMS_GATEWAY_URL, token = process.env.SMS_GATEWAY_TOKEN) {
    if (!url) throw new Error('HttpSmsAdapter 需要 SMS_GATEWAY_URL');
    this.url = url;
    this.token = token;
  }

  async send(phone: string, text: string): Promise<void> {
    const resp = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify({ phone, text }),
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) {
      throw new Error(`SMS 网关返回 HTTP ${resp.status}`);
    }
  }
}
