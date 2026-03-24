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

describe('Auth and session flows (e2e)', () => {
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

  it('supports tenant login, refresh, me, and logout using refresh sessions', async () => {
    const password = 'P@ssw0rd!' + Date.now();
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash(password, 10);

    const company = await prisma.company.create({
      data: { name: rnd('auth_co'), businessType: 'RETAIL' },
    });

    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        email: `${rnd('auth_user')}@example.com`,
        name: 'Auth User',
        role: 'ADMIN',
        passwordHash: hash,
        isActive: true,
      },
    });

    const agent = http(app.getHttpServer());

    const loginRes = await agent.post('/api/auth/login').send({
      email: user.email,
      password,
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body?.data?.access_token).toBeTruthy();
    expect(loginRes.headers['set-cookie']).toBeDefined();

    const accessToken = loginRes.body.data.access_token;

    const meRes = await agent
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(meRes.body?.data?.user?.email).toBe(user.email);

    const refreshCookie = (loginRes.headers['set-cookie'] ?? []).find((cookie: string) =>
      cookie.startsWith('refresh_token='),
    );
    expect(refreshCookie).toBeTruthy();
    const refreshToken = decodeURIComponent(
      refreshCookie?.split(';')[0]?.replace('refresh_token=', '') ?? '',
    );
    expect(refreshToken).toBeTruthy();

    const refreshRes = await agent
      .post('/api/auth/refresh')
      .send({ refresh_token: refreshToken })
      .expect(200);

    expect(refreshRes.body?.data?.access_token).toBeTruthy();

    const logoutRes = await agent
      .post('/api/auth/logout')
      .send({ refresh_token: refreshToken })
      .expect(200);

    expect(logoutRes.body?.data?.ok ?? logoutRes.body?.ok).toBe(true);

    await agent
      .post('/api/auth/refresh')
      .send({ refresh_token: refreshToken })
      .expect(401);
  });

  it('supports forgot-password and reset-password flow', async () => {
    const password = 'P@ssw0rd!' + Date.now();
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash(password, 10);

    const company = await prisma.company.create({
      data: { name: rnd('reset_co'), businessType: 'RETAIL' },
    });

    const email = `${rnd('reset_user')}@example.com`;
    await prisma.user.create({
      data: {
        companyId: company.id,
        email,
        name: 'Reset User',
        role: 'ADMIN',
        passwordHash: hash,
        isActive: true,
      },
    });

    const forgotRes = await http(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email })
      .expect(200);

    const resetToken = forgotRes.body?.data?.dev?.reset_token;
    expect(resetToken).toBeTruthy();

    const newPassword = 'Reset123!' + Date.now();
    const resetRes = await http(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token: resetToken, password: newPassword })
      .expect(200);

    expect(resetRes.body?.data?.ok).toBe(true);

    const loginRes = await http(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: newPassword })
      .expect(200);

    expect(loginRes.body?.data?.access_token).toBeTruthy();
  });
});
