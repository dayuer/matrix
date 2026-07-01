import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { parseRouter } from '../../src/api/parse';
import { geoRouter } from '../../src/api/geo';
import { createFakeDeps } from '../../src/adapters/fake';

function app(router: express.Router) {
  const a = express();
  a.use(express.json());
  a.use('/api', router);
  return a;
}

describe('rate limiting', () => {
  it('429s /api/parse after the per-IP window limit (30/min)', async () => {
    const a = app(parseRouter(createFakeDeps()));
    let last = 200;
    for (let i = 0; i < 31; i++) {
      last = (await request(a).post('/api/parse').send({ text: '去望京', city: '北京' })).status;
    }
    expect(last).toBe(429);
  });

  it('429s /api/geo after the per-IP window limit (60/min)', async () => {
    const a = app(geoRouter(createFakeDeps()));
    let last = 200;
    for (let i = 0; i < 61; i++) {
      last = (await request(a).post('/api/geo').send({ type: 'search', keyword: '望京', city: '北京' })).status;
    }
    expect(last).toBe(429);
  });
});
