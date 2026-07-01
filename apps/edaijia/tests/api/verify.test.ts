import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createApiRouter } from '../../src/api/index';
import { createFakeDeps } from '../../src/adapters/fake';
import { signToken, verifyToken } from '../../src/lib/token';

function setup() {
  const deps = createFakeDeps();
  const a = express();
  a.use('/api', createApiRouter(deps));
  return { a, deps };
}

const draft = { origin: { name: '国贸' }, destination: { name: '望京' } };

describe('POST /api/verify/send', () => {
  it('sends an sms and does NOT leak linkToken', async () => {
    const { a, deps } = setup();
    const res = await request(a)
      .post('/api/verify/send')
      .send({ phone: '13800000000', draft, sessionId: 'sess-001' });
    expect(res.status).toBe(200);
    expect(res.body.sent).toBe(true);
    // 🔒 安全修复验证：响应中不应包含 linkToken
    expect(res.body.linkToken).toBeUndefined();
    // SMS 应已发出
    expect(deps.sms.sent).toHaveLength(1);
    expect(deps.sms.sent[0].text).toContain('/api/verify/click?t=');
  });

  it('rejects an invalid phone', async () => {
    const { a } = setup();
    const res = await request(a)
      .post('/api/verify/send')
      .send({ phone: '123', draft, sessionId: 'sess-002' });
    expect(res.status).toBe(400);
  });

  it('rejects a missing sessionId', async () => {
    const { a } = setup();
    const res = await request(a)
      .post('/api/verify/send')
      .send({ phone: '13800000000', draft });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('missing_session_id');
  });

  it('rate-limits resends per phone', async () => {
    const { a } = setup();
    let last = 200;
    for (let i = 0; i < 7; i++) {
      last = (
        await request(a)
          .post('/api/verify/send')
          .send({ phone: '13900000000', draft, sessionId: `sess-${i}` })
      ).status;
    }
    expect(last).toBe(429);
  });
});

describe('GET /api/verify/click', () => {
  it('activates a valid magic link, creates order, and marks session verified', async () => {
    const { a, deps } = setup();

    // 先发送短信获取 session 绑定
    await request(a)
      .post('/api/verify/send')
      .send({ phone: '13800000000', draft, sessionId: 'sess-click-001' });

    // 从 SMS 中提取 magic link token
    const smsText = deps.sms.sent[0].text;
    const tokenMatch = smsText.match(/t=([^\s]+)/);
    expect(tokenMatch).toBeTruthy();
    const magicToken = tokenMatch![1];

    // 激活 magic link
    const res = await request(a).get(`/api/verify/click?t=${magicToken}`);
    expect(res.status).toBe(200);
    expect(res.body.verified).toBe(true);
    expect(res.body.orderId).toBeTruthy();
    expect(res.body.queryToken).toBeTruthy();
    expect(res.body.loginCredential).toBeTruthy();

    // 验证 queryToken 有效
    const q = verifyToken(res.body.queryToken, deps.tokenSecret);
    expect(q?.kind).toBe('query');
    expect(q?.orderId).toBe(res.body.orderId);
  });

  it('rejects an already consumed token (single-use)', async () => {
    const { a, deps } = setup();

    await request(a)
      .post('/api/verify/send')
      .send({ phone: '13800000000', draft, sessionId: 'sess-click-002' });

    const smsText = deps.sms.sent[0].text;
    const magicToken = smsText.match(/t=([^\s]+)/)![1];

    // 第一次激活
    const res1 = await request(a).get(`/api/verify/click?t=${magicToken}`);
    expect(res1.status).toBe(200);

    // 第二次激活（重放）应被拒绝
    const res2 = await request(a).get(`/api/verify/click?t=${magicToken}`);
    expect(res2.status).toBe(409);
    expect(res2.body.error).toBe('already_used');
  });

  it('rejects an invalid token', async () => {
    const { a } = setup();
    const res = await request(a).get('/api/verify/click?t=garbage');
    expect(res.status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const { a, deps } = setup();
    // 签发一个已过期的 token
    const expired = signToken(
      { kind: 'magic', phone: '13800000000', draft, sessionId: 'sess-exp' },
      deps.tokenSecret,
      -1000 // 已过期
    );
    const res = await request(a).get(`/api/verify/click?t=${expired}`);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/verify/poll', () => {
  it('returns verified:false before magic link is clicked', async () => {
    const { a } = setup();

    await request(a)
      .post('/api/verify/send')
      .send({ phone: '13800000000', draft, sessionId: 'sess-poll-001' });

    const res = await request(a).get('/api/verify/poll?sessionId=sess-poll-001');
    expect(res.status).toBe(200);
    expect(res.body.verified).toBe(false);
  });

  it('returns verified:true with credentials after magic link is clicked', async () => {
    const { a, deps } = setup();

    await request(a)
      .post('/api/verify/send')
      .send({ phone: '13800000000', draft, sessionId: 'sess-poll-002' });

    // 激活 magic link
    const smsText = deps.sms.sent[0].text;
    const magicToken = smsText.match(/t=([^\s]+)/)![1];
    await request(a).get(`/api/verify/click?t=${magicToken}`);

    // 轮询状态
    const res = await request(a).get('/api/verify/poll?sessionId=sess-poll-002');
    expect(res.status).toBe(200);
    expect(res.body.verified).toBe(true);
    expect(res.body.orderId).toBeTruthy();
    expect(res.body.queryToken).toBeTruthy();
    expect(res.body.loginCredential).toBeTruthy();
  });

  it('returns verified:false for unknown sessionId', async () => {
    const { a } = setup();
    const res = await request(a).get('/api/verify/poll?sessionId=unknown');
    expect(res.status).toBe(200);
    expect(res.body.verified).toBe(false);
  });

  it('rejects missing sessionId', async () => {
    const { a } = setup();
    const res = await request(a).get('/api/verify/poll');
    expect(res.status).toBe(400);
  });
});
