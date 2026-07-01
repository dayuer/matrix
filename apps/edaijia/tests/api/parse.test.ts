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

describe('POST /api/parse', () => {
  it('returns a ride card with two elements', async () => {
    const res = await request(app()).post('/api/parse').send({ text: '我在国贸喝多了想去望京SOHO', city: '北京' });
    expect(res.status).toBe(200);
    expect(res.body.intent).toBe('ride');
    expect(res.body.card.destination.name).toBe('望京SOHO');
  });

  it('asks for the missing destination', async () => {
    const res = await request(app()).post('/api/parse').send({ text: '我在国贸喝多了', city: '北京' });
    expect(res.body.missing).toContain('destination');
    expect(res.body.ask).toBe('要去哪？');
  });

  it('correctly handles text with spaces inside', async () => {
    const res = await request(app()).post('/api/parse').send({
      text: '我在 广州市员村街道 喝了酒，帮我送回天河体育中心',
      city: '广州'
    });
    expect(res.status).toBe(200);
    expect(res.body.intent).toBe('ride');
    expect(res.body.card.origin.name).toBe('广州市员村街道');
    expect(res.body.card.destination.name).toBe('天河体育中心');
    expect(res.body.missing).toHaveLength(0);
  });

  it('rejects empty text', async () => {
    const res = await request(app()).post('/api/parse').send({ text: '', city: '北京' });
    expect(res.status).toBe(400);
  });
});
