/// <reference types="jest" />
import { INestApplication } from '@nestjs/common';
import { createHmac } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const http = (server: any) =>
  ((request as any).default ?? (request as any))(server);

function rnd(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

describe('Platform failure paths (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.FILE_SIGNING_SECRET = 'platform-failure-file-secret';
    process.env.NOTIFICATIONS_EMAIL_WEBHOOK_URL = 'http://127.0.0.1:1/unreachable';
    process.env.BILLING_STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('covers notification failure + retry, file token validation, and invalid webhook rejection', async () => {
    const password = `P@ssw0rd!${Date.now()}`;
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    const company = await prisma.company.create({
      data: { name: rnd('platform_fail_co'), businessType: 'RETAIL' },
    });

    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        email: `${rnd('platform_fail_user')}@example.com`,
        name: 'Platform Failure User',
        role: 'ADMIN',
        passwordHash,
        isActive: true,
      },
    });

    const loginRes = await http(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user.email, password })
      .expect(200);

    const accessToken = loginRes.body?.data?.access_token;
    expect(accessToken).toBeTruthy();

    const templateRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/notification-templates`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        code: 'failure_test',
        channel: 'email',
        subject: 'Failure {{name}}',
        body: 'Hello {{name}}',
      })
      .expect(201);

    expect(templateRes.body.data.code).toBe('failure_test');

    const enqueueRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/notifications/test`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        template_code: 'failure_test',
        channel: 'email',
        to_address: 'failure@example.com',
        sample_payload: { name: 'Failure' },
      })
      .expect(201);

    const outboxId = enqueueRes.body.data.outbox_id;

    const processRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/notifications/process`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    expect(processRes.body.data.processed_count).toBeGreaterThanOrEqual(1);

    const outboxRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/notifications/outbox`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const failedRow = outboxRes.body.data.find((row: any) => row.id === outboxId);
    expect(failedRow.status).toBe('failed');
    expect(failedRow.attempts).toBe(1);
    expect(String(failedRow.last_error ?? '')).toBeTruthy();

    const retryRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/notifications/outbox/${outboxId}/retry`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(retryRes.body.data.status).toBe('failed');
    expect(retryRes.body.data.attempts).toBe(2);

    const signRes = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/files/sign-upload`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'attachment',
        mime_type: 'text/plain',
        size_bytes: 5,
      })
      .expect(201);

    const goodToken = signRes.body.data.token as string;
    const badToken = `${goodToken.slice(0, -1)}${goodToken.endsWith('a') ? 'b' : 'a'}`;

    await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/files/upload?token=${encodeURIComponent(badToken)}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Content-Type', 'text/plain')
      .send('hello')
      .expect(400);

    const payload = {
      id: `evt_${Date.now()}`,
      type: 'checkout.session.completed',
      company_id: company.id,
    };
    const payloadRaw = JSON.stringify(payload);
    const badSignature = 't=1234567890,v1=deadbeef';

    await http(app.getHttpServer())
      .post('/api/billing/webhooks/stripe')
      .set('stripe-signature', badSignature)
      .set('Content-Type', 'application/json')
      .send(payload)
      .expect(400);

    const webhookEvents = await prisma.webhookEvent.findMany({
      where: {
        provider: 'stripe',
        companyId: company.id,
        providerEventId: payload.id,
      },
      orderBy: { receivedAt: 'desc' },
    });

    expect(webhookEvents.length).toBeGreaterThanOrEqual(1);
    expect(webhookEvents[0].status).toBe('rejected');
  });

  it('accepts a valid stripe signature and stores a processed webhook event', async () => {
    const company = await prisma.company.create({
      data: { name: rnd('stripe_ok_co'), businessType: 'RETAIL' },
    });

    const plan = await prisma.subscriptionPlan.create({
      data: {
        code: rnd('plan'),
        name: 'Webhook Plan',
        priceInr: 999,
        billingInterval: 'month',
        isActive: true,
      },
    });

    const subscription = await prisma.subscription.create({
      data: {
        companyId: company.id,
        planId: plan.id,
        plan: plan.code,
        provider: 'stripe',
        status: 'checkout_created',
      },
    });

    const payload = {
      id: `evt_${Date.now()}_ok`,
      type: 'checkout.session.completed',
      company_id: company.id,
      data: {
        object: {
          metadata: {
            company_id: company.id,
            subscription_id: subscription.id,
          },
        },
      },
    };
    const payloadRaw = JSON.stringify(payload);
    const timestamp = '1234567890';
    const digest = createHmac('sha256', process.env.BILLING_STRIPE_WEBHOOK_SECRET as string)
      .update(`${timestamp}.${payloadRaw}`)
      .digest('hex');

    await http(app.getHttpServer())
      .post('/api/billing/webhooks/stripe')
      .set('stripe-signature', `t=${timestamp},v1=${digest}`)
      .set('Content-Type', 'application/json')
      .send(payloadRaw)
      .expect(201);

    const event = await prisma.webhookEvent.findFirst({
      where: {
        provider: 'stripe',
        providerEventId: payload.id,
      },
      orderBy: { receivedAt: 'desc' },
    });

    expect(event).toBeTruthy();
    expect(event?.status).toBe('processed');

    const updatedSubscription = await prisma.subscription.findUnique({
      where: { id: subscription.id },
    });
    expect(updatedSubscription?.status).toBe('active');
  });

});
