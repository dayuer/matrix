import { Router, Request, Response } from 'express';
import { AppDeps } from '../adapters/types';
import { RateLimiter } from '../lib/rateLimit';

export function geoRouter(deps: AppDeps): Router {
  const r = Router();
  // 按 IP 限频，挡住刷地图烧调用费（PRD §8）。60 次 / 分钟。
  const limiter = new RateLimiter(60, 60_000);

  r.post('/geo', async (req: Request, res: Response) => {
    if (!limiter.hit(req.ip || 'unknown')) {
      return res.status(429).json({ error: 'too_many' });
    }
    const { type, lng, lat, keyword, city } = req.body ?? {};
    if (type === 'reverse' && typeof lng === 'number' && typeof lat === 'number') {
      return res.json(await deps.geo.reverse(lng, lat, String(city ?? '')));
    }
    if (type === 'search' && typeof keyword === 'string') {
      return res.json(await deps.geo.search(keyword, String(city ?? '')));
    }
    return res.status(400).json({ error: 'bad_request' });
  });
  return r;
}
