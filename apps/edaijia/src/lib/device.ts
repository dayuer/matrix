/**
 * device.ts — 设备类型识别中间件
 *
 * 极简 UA 检测，无第三方依赖。
 * 仅区分 mobile / desktop，供 SSR 模板分叉使用。
 */
import type { Request, Response, NextFunction } from 'express';

const MOBILE_RE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;

export type DeviceType = 'mobile' | 'desktop';

/** 从 User-Agent 判断设备类型 */
export function detectDevice(ua: string): DeviceType {
  return MOBILE_RE.test(ua) ? 'mobile' : 'desktop';
}

/**
 * Express 中间件：将 `res.locals.device` 设为 'mobile' | 'desktop'
 * 同时设置 `Vary: User-Agent` 响应头（CDN 缓存区分）
 */
export function deviceMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ua = req.headers['user-agent'] || '';
  res.locals.device = detectDevice(ua);
  res.setHeader('Vary', 'User-Agent');
  next();
}
