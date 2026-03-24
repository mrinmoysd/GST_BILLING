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

describe('Admin governance (e2e)', () => {
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

  it('creates internal admin users and records audit entries', async () => {
    const password = 'AdminP@ss!' + Date.now();
    const email = `${rnd('superadmin')}@example.com`;

    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        companyId: null,
        email,
        name: 'Super Admin',
        role: 'super_admin',
        isActive: true,
        passwordHash: hash,
      },
    });

    const loginRes = await http(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ email, password })
      .expect(200);

    const accessToken = loginRes.body?.data?.access_token;
    expect(accessToken).toBeTruthy();

    const createdEmail = `${rnd('ops')}@example.com`;
    const createRes = await http(app.getHttpServer())
      .post('/api/admin/internal-users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        email: createdEmail,
        password: 'ChangeMe123!',
        role: 'operations_admin',
        name: 'Ops Admin',
      })
      .expect(201);

    expect(createRes.body?.data?.email).toBe(createdEmail);
    expect(createRes.body?.data?.role).toBe('operations_admin');

    const listAuditRes = await http(app.getHttpServer())
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const auditRows = listAuditRes.body?.data ?? [];
    const createdAudit = auditRows.find(
      (row: any) =>
        row.action === 'admin.internal_user.created' &&
        row.summary.includes(createdEmail),
    );

    expect(createdAudit).toBeTruthy();

    const dbAudit = await prisma.internalAdminAuditLog.findFirst({
      where: {
        action: 'admin.internal_user.created',
        summary: { contains: createdEmail },
      },
    });
    expect(dbAudit).toBeTruthy();
  });
});
