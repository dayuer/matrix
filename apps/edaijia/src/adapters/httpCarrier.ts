/**
 * httpCarrier.ts — 真实运营商一键登录校验适配器
 *
 * 职责：把前端运营商号码认证 SDK 拿到的一次性 token 交给认证服务换取手机号。
 * 兼容接受 `{ token }` 并返回 `{ phone }`（或 `{ code:0, phone }`）的 HTTP 端点
 * （阿里云号码认证 / 极光认证 / 运营商网关，具体字段由网关侧适配）。
 *
 * 启用：CARRIER_PROVIDER=http
 *   CARRIER_API_URL 必填
 *   CARRIER_API_KEY 可选，作为 Bearer 鉴权
 *
 * 失败 / 拿不到号 → 返回 null（由 /api/order 返回 401，前端降级 Magic Link）。
 */
import { CarrierAuthAdapter } from './types';

export class HttpCarrierAdapter implements CarrierAuthAdapter {
  private url: string;
  private key?: string;

  constructor(url = process.env.CARRIER_API_URL, key = process.env.CARRIER_API_KEY) {
    if (!url) throw new Error('HttpCarrierAdapter 需要 CARRIER_API_URL');
    this.url = url;
    this.key = key;
  }

  async verify(token: string): Promise<string | null> {
    try {
      const resp = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.key ? { Authorization: `Bearer ${this.key}` } : {}),
        },
        body: JSON.stringify({ token }),
        signal: AbortSignal.timeout(5000),
      });
      if (!resp.ok) return null;
      const data = (await resp.json()) as { code?: number | string; phone?: string };
      if (data.code !== undefined && String(data.code) !== '0') return null;
      return /^1\d{10}$/.test(data.phone ?? '') ? (data.phone as string) : null;
    } catch (err) {
      console.warn('[carrier] 一键登录校验失败:', (err as Error).message);
      return null;
    }
  }
}
