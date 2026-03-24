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

describe('Onboarding (e2e)', () => {
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

  it('bootstraps company, owner, default invoice series, and session', async () => {
    const email = `${rnd('onboard')}@example.com`;
    const payload = {
      company_name: rnd('Onboard Co'),
      owner_name: 'Owner User',
      email,
      password: 'ChangeMe123!',
      gstin: '22AAAAA0000A1Z5',
      state: 'West Bengal',
      state_code: '19',
      invoice_prefix: 'INV-',
    };

    const res = await http(app.getHttpServer())
      .post('/api/onboarding/bootstrap')
      .send(payload)
      .expect(200);

    expect(res.body.data.access_token).toBeTruthy();
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.onboarding.completed).toBe(true);
    expect(res.headers['set-cookie']).toBeDefined();

    const user = await prisma.user.findFirst({
      where: { email },
      include: { company: true },
    });
    expect(user).toBeTruthy();
    expect(user?.role).toBe('owner');
    expect(user?.company?.name).toBe(payload.company_name);

    const invoiceSeries = await prisma.invoiceSeries.findFirst({
      where: { companyId: user!.companyId!, code: 'DEFAULT' },
    });
    expect(invoiceSeries).toBeTruthy();

    const session = await prisma.session.findFirst({
      where: {
        userId: user!.id,
        companyId: user!.companyId!,
        revokedAt: null,
      },
    });
    expect(session).toBeTruthy();
  });

  it('rejects bootstrap when email already exists', async () => {
    const email = `${rnd('dup')}@example.com`;

    await prisma.company.create({
      data: {
        name: rnd('Existing Co'),
        businessType: 'trader',
        users: {
          create: {
            email,
            name: 'Existing Owner',
            role: 'owner',
            isActive: true,
            passwordHash: 'hash',
          },
        },
      },
    });

    const res = await http(app.getHttpServer())
      .post('/api/onboarding/bootstrap')
      .send({
        company_name: rnd('New Co'),
        owner_name: 'New Owner',
        email,
        password: 'ChangeMe123!',
      });

    expect(res.status).toBe(409);
  });
});
