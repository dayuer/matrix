import { Router, Request, Response } from 'express';
import { AppDeps } from '../adapters/types';
import { OrderDraft } from '../domain/types';
import { signToken, verifyToken } from '../lib/token';

const QUERY_TTL_MS = 7 * 24 * 60 * 60_000;
const LOGIN_TTL_MS = 365 * 24 * 60 * 60_000;

function maskPhone(p: string): string {
  return p.length === 11 ? `${p.slice(0, 3)}****${p.slice(7)}` : p;
}

async function resolveAuth(deps: AppDeps, auth: { type?: string; token?: string }): Promise<{ phone: string; draft?: OrderDraft } | null> {
  const token = String(auth?.token ?? '');
  if (auth?.type === 'carrier') {
    const phone = await deps.carrier.verify(token);
    return phone ? { phone } : null;
  }
  if (auth?.type === 'magic') {
    const p = verifyToken(token, deps.tokenSecret);
    return p && p.kind === 'magic' ? { phone: p.phone, draft: p.draft as OrderDraft } : null;
  }
  if (auth?.type === 'login') {
    const p = verifyToken(token, deps.tokenSecret);
    return p && p.kind === 'login' ? { phone: p.phone } : null;
  }
  return null;
}

export function orderRouter(deps: AppDeps): Router {
  const r = Router();

  r.post('/order', async (req: Request, res: Response) => {
    const resolved = await resolveAuth(deps, req.body?.auth ?? {});
    if (!resolved) return res.status(401).json({ error: 'unverified' });

    const draft: OrderDraft = resolved.draft ?? req.body?.draft ?? {};
    const origin = draft.origin;
    const destination = draft.destination;
    if (!origin?.name || !destination?.name) {
      return res.status(400).json({ error: 'incomplete_draft' });
    }

    const order = await deps.backend.createOrder(resolved.phone, {
      origin,
      destination,
      riderPhone: draft.riderPhone,
      note: draft.note,
    });

    const queryToken = signToken({ kind: 'query', phone: resolved.phone, orderId: order.id }, deps.tokenSecret, QUERY_TTL_MS);
    const loginCredential = signToken({ kind: 'login', phone: resolved.phone }, deps.tokenSecret, LOGIN_TTL_MS);
    return res.json({ orderId: order.id, queryToken, loginCredential });
  });

  r.get('/order/:token', async (req: Request, res: Response) => {
    const p = verifyToken(req.params.token, deps.tokenSecret);
    if (!p || p.kind !== 'query' || !p.orderId) return res.status(401).json({ error: 'unauthorized' });
    const order = await deps.backend.getOrder(p.orderId);
    if (!order) return res.status(404).json({ error: 'not_found' });
    return res.json({
      status: order.status,
      timeline: order.timeline,
      origin: order.origin,
      destination: order.destination,
      maskedPhone: maskPhone(order.phone),
    });
  });

  r.post('/order/:token/cancel', async (req: Request, res: Response) => {
    const p = verifyToken(req.params.token, deps.tokenSecret);
    if (!p || p.kind !== 'query' || !p.orderId) return res.status(401).json({ error: 'unauthorized' });
    const ok = await deps.backend.cancelOrder(p.orderId);
    if (!ok) return res.status(409).json({ error: 'not_cancellable', hint: '已接单，请联系司机或拨 95139' });
    return res.json({ cancelled: true });
  });

  return r;
}
