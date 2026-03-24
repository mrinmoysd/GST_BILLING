/// <reference types="jest" />
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const http = (server: any) =>
  ((request as any).default ?? (request as any))(server);

function rnd(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

describe('Admin subscription operations (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
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

  it('allows admin subscription state changes and records audit history', async () => {
    const password = 'AdminP@ss!' + Date.now();
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash(password, 10);

    const superAdmin = await prisma.user.create({
      data: {
        companyId: null,
        email: `${rnd('billing_admin')}@example.com`,
        name: 'Billing Admin',
        role: 'super_admin',
        isActive: true,
        passwordHash: hash,
      },
    });

    const company = await prisma.company.create({
      data: { name: rnd('sub_co'), businessType: 'RETAIL' },
    });

    const planA = await prisma.subscriptionPlan.create({
      data: {
        code: rnd('plan_basic'),
        name: 'Basic Plan',
        priceInr: 499,
        billingInterval: 'month',
        isActive: true,
      },
    });

    const planB = await prisma.subscriptionPlan.create({
      data: {
        code: rnd('plan_growth'),
        name: 'Growth Plan',
        priceInr: 999,
        billingInterval: 'month',
        isActive: true,
      },
    });

    const subscription = await prisma.subscription.create({
      data: {
        companyId: company.id,
        planId: planA.id,
        plan: planA.code,
        status: 'active',
        provider: 'stripe',
        providerSubscriptionId: rnd('stripe_sub'),
        startedAt: new Date('2026-03-01T00:00:00.000Z'),
      },
    });

    const loginRes = await http(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ email: superAdmin.email, password })
      .expect(200);

    const accessToken = loginRes.body?.data?.access_token;
    expect(accessToken).toBeTruthy();

    const detailRes = await http(app.getHttpServer())
      .get(`/api/admin/subscriptions/${subscription.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(detailRes.body?.data?.current?.plan).toBe(planA.code);
    expect(detailRes.body?.data?.current?.status).toBe('active');

    const updateRes = await http(app.getHttpServer())
      .patch(`/api/admin/subscriptions/${subscription.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        action: 'change_plan',
        plan_code: planB.code,
        note: 'Upgrade customer to growth',
      })
      .expect(200);

    expect(updateRes.body?.data?.current?.plan).toBe(planB.code);

    const markPastDue = await http(app.getHttpServer())
      .patch(`/api/admin/subscriptions/${subscription.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        action: 'mark_past_due',
        note: 'Payment failed',
      })
      .expect(200);

    expect(markPastDue.body?.data?.current?.status).toBe('past_due');

    const auditRows = await prisma.internalAdminAuditLog.findMany({
      where: {
        action: 'admin.subscription.updated',
        targetId: subscription.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(auditRows.length).toBeGreaterThanOrEqual(2);
    expect(auditRows[0].summary).toContain(subscription.id);
  });
});

