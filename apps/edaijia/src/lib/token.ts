import { createHmac, timingSafeEqual } from 'crypto';

export interface TokenPayload {
  kind: 'magic' | 'login' | 'query';
  phone: string;
  orderId?: string;
  draft?: unknown;
  exp?: number;
  [key: string]: unknown;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function hmac(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

export function signToken(payload: TokenPayload, secret: string, ttlMs: number): string {
  const body = { ...payload, exp: Date.now() + ttlMs };
  const data = b64url(JSON.stringify(body));
  return `${data}.${hmac(data, secret)}`;
}

export function verifyToken(token: string, secret: string): TokenPayload | null {
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = hmac(data, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const body = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as TokenPayload;
    if (typeof body.exp !== 'number' || body.exp < Date.now()) return null;
    return body;
  } catch {
    return null;
  }
}
