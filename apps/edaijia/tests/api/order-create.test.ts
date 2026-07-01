import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createApiRouter } from '../../src/api/index';
import { createFakeDeps } from '../../src/adapters/fake';
import { signToken, verifyToken } from '../../src/lib/token';

function setup() {
  const deps = createFakeDeps();
  const a = express();
  a.use(express.json());
  a.use('/api', createApiRouter(deps));
  return { a, deps };
}

const draft = { origin: { name: '国贸' }, destination: { name: '望京' } };

describe('POST /api/order', () => {
  it('creates an order from a carrier token', async () => {
    const { a, deps } = setup();
    const res = await request(a).post('/api/order').send({ auth: { type: 'carrier', token: 'carrier:13800000000' }, draft });
    expect(res.status).toBe(200);
    expect(res.body.orderId).toMatch(/.+/);
    const q = verifyToken(res.body.queryToken, deps.tokenSecret);
    expect(q?.kind).toBe('query');
    expect(q?.orderId).toBe(res.body.orderId);
    const login = verifyToken(res.body.loginCredential, deps.tokenSecret);
    expect(login?.kind).toBe('login');
  });

  it('creates an order from a magic token carrying the draft', async () => {
    const { a, deps } = setup();
    const magic = signToken({ kind: 'magic', phone: '13800000000', draft }, deps.tokenSecret, 60_000);
    const res = await request(a).post('/api/order').send({ auth: { type: 'magic', token: magic } });
    expect(res.status).toBe(200);
    expect(res.body.orderId).toMatch(/.+/);
  });

  it('rejects an unverified order', async () => {
    const { a } = setup();
    const res = await request(a).post('/api/order').send({ auth: { type: 'carrier', token: 'bad' }, draft });
    expect(res.status).toBe(401);
  });

  it('rejects a draft missing destination', async () => {
    const { a } = setup();
    const res = await request(a)
      .post('/api/order')
      .send({ auth: { type: 'carrier', token: 'carrier:13800000000' }, draft: { origin: { name: '国贸' } } });
    expect(res.status).toBe(400);
  });
});
