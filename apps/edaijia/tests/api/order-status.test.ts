import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createApiRouter } from '../../src/api/index';
import { createFakeDeps } from '../../src/adapters/fake';

function setup() {
  const deps = createFakeDeps();
  const a = express();
  a.use(express.json());
  a.use('/api', createApiRouter(deps));
  return { a, deps };
}

const draft = { origin: { name: '国贸' }, destination: { name: '望京' } };

async function place(a: express.Express) {
  const res = await request(a).post('/api/order').send({ auth: { type: 'carrier', token: 'carrier:13800008888' }, draft });
  return res.body as { orderId: string; queryToken: string };
}

describe('GET /api/order/:token', () => {
  it('returns status, timeline and masked phone', async () => {
    const { a } = setup();
    const { queryToken } = await place(a);
    const res = await request(a).get(`/api/order/${queryToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('accepted');
    expect(res.body.timeline[0].status).toBe('accepted');
    expect(res.body.destination.name).toBe('望京');
    expect(res.body.maskedPhone).toBe('138****8888');
  });

  it('reflects advanced status', async () => {
    const { a, deps } = setup();
    const { orderId, queryToken } = await place(a);
    deps.backend.store_().advance(orderId, 'calling_driver');
    const res = await request(a).get(`/api/order/${queryToken}`);
    expect(res.body.status).toBe('calling_driver');
  });

  it('rejects an invalid token', async () => {
    const { a } = setup();
    const res = await request(a).get('/api/order/garbage');
    expect(res.status).toBe(401);
  });

  it('cancels before driver assigned', async () => {
    const { a } = setup();
    const { queryToken } = await place(a);
    const res = await request(a).post(`/api/order/${queryToken}/cancel`);
    expect(res.status).toBe(200);
    expect(res.body.cancelled).toBe(true);
  });

  it('refuses cancel after driver assigned', async () => {
    const { a, deps } = setup();
    const { orderId, queryToken } = await place(a);
    deps.backend.store_().advance(orderId, 'driver_assigned');
    const res = await request(a).post(`/api/order/${queryToken}/cancel`);
    expect(res.status).toBe(409);
  });
});
