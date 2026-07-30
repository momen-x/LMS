import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import express from 'express';
import request from 'supertest';
import { CsrfService } from './csrf.service';
import { CsrfSessionMiddleware } from './csrf-session.middleware';

describe('CSRF protection', () => {
  const createApp = () => {
    const config = new ConfigService({
      NODE_ENV: 'development',
      CSRF_SECRET: 'test-secret-with-at-least-thirty-two-bytes',
    });
    const csrf = new CsrfService(config);
    const session = new CsrfSessionMiddleware(config);
    const app = express();

    app.use(cookieParser());
    app.use(session.use.bind(session));
    app.use(csrf.protect.bind(csrf));
    app.get('/api/auth/csrf-token', (req, res) => {
      res.json({ csrfToken: csrf.getCsrfToken(req, res) });
    });
    app.get('/safe', (_req, res) => res.json({ reached: true }));
    for (const method of ['post', 'put', 'patch', 'delete'] as const) {
      app[method]('/unsafe', (_req, res) => res.json({ reached: true }));
    }
    app.post('/api/payment/webhook', (_req, res) =>
      res.json({ signatureValidationReached: true }),
    );
    return app;
  };

  async function obtainToken(agent: request.Agent) {
    const response = await agent.get('/api/auth/csrf-token').expect(200);
    expect(response.body.csrfToken).toEqual(expect.any(String));
    expect(response.headers['set-cookie'].join(';')).toContain('lms.csrf-id=');
    expect(response.headers['set-cookie'].join(';')).toContain(
      'lms.csrf-token=',
    );
    return response.body.csrfToken as string;
  }

  it('issues matching cookies and accepts their header on unsafe requests', async () => {
    const agent = request.agent(createApp());
    const token = await obtainToken(agent);
    await agent.post('/unsafe').set('X-CSRF-Token', token).expect(200);
  });

  it.each(['post', 'put', 'patch', 'delete'] as const)(
    'requires CSRF for %s',
    async (method) => {
      const response = await request(createApp())
        [method]('/unsafe')
        .expect(403);
      expect(response.body.code).toBe('INVALID_CSRF_TOKEN');
    },
  );

  it('rejects a missing, invalid, or unpaired token', async () => {
    const agent = request.agent(createApp());
    await obtainToken(agent);
    await agent.post('/unsafe').expect(403);
    await agent.post('/unsafe').set('X-CSRF-Token', 'invalid').expect(403);

    const isolated = request(createApp());
    await isolated.post('/unsafe').set('X-CSRF-Token', 'unpaired').expect(403);
  });

  it('allows safe GET, the exact Stripe webhook, and Bearer-only requests', async () => {
    const app = createApp();
    await request(app).get('/safe').expect(200);
    await request(app).post('/api/payment/webhook').expect(200);
    await request(app)
      .post('/unsafe')
      .set('Authorization', 'Bearer explicit-token')
      .expect(200);
  });

  it('does not exempt Bearer requests when an auth cookie is present', async () => {
    const response = await request(createApp())
      .post('/unsafe')
      .set('Authorization', 'Bearer explicit-token')
      .set('Cookie', 'access_token=cookie-token')
      .expect(403);
    expect(response.body.code).toBe('INVALID_CSRF_TOKEN');
  });
});
