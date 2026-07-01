import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createApiRouter } from '../../src/api/index';
import { createFakeDeps } from '../../src/adapters/fake';

function app() {
  const a = express();
  a.use(express.json());
  a.use('/api', createApiRouter(createFakeDeps()));
  return a;
}

describe('POST /api/geo', () => {
  it('reverse geocodes coordinates', async () => {
    const res = await request(app()).post('/api/geo').send({ type: 'reverse', lng: 116.4, lat: 39.9, city: '北京' });
    expect(res.status).toBe(200);
    expect(res.body.pois.length).toBeGreaterThan(0);
  });

  it('searches by keyword', async () => {
    const res = await request(app()).post('/api/geo').send({ type: 'search', keyword: '望京', city: '北京' });
    expect(res.status).toBe(200);
    expect(res.body.pois[0].name).toContain('望京');
  });

  it('rejects bad type', async () => {
    const res = await request(app()).post('/api/geo').send({ type: 'nope' });
    expect(res.status).toBe(400);
  });
});
