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

describe('Accounting period lock (e2e)', () => {
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

  it('updates period lock and blocks manual journals inside the locked range', async () => {
    const password = 'P@ssw0rd!' + Date.now();
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash(password, 10);

    const company = await prisma.company.create({
      data: { name: rnd('acct_co'), businessType: 'RETAIL' },
    });

    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        email: `${rnd('acct_user')}@example.com`,
        name: 'Accounting User',
        role: 'ADMIN',
        passwordHash: hash,
      },
    });

    const loginRes = await http(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user.email, password })
      .expect(200);

    const accessToken = loginRes.body?.data?.access_token;
    expect(accessToken).toBeTruthy();

    const setLock = await http(app.getHttpServer())
      .put(`/api/companies/${company.id}/accounting/period-lock`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ lock_until: '2026-03-31', reason: 'March close' })
      .expect(200);

    expect(setLock.body?.data?.lock_until).toBe('2026-03-31');

    const ledgersRes = await http(app.getHttpServer())
      .get(`/api/companies/${company.id}/ledgers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const ledgers = ledgersRes.body?.data ?? [];
    const cash = ledgers.find((row: any) => row.account_code === '1000');
    const sales = ledgers.find((row: any) => row.account_code === '4000');

    expect(cash?.id).toBeTruthy();
    expect(sales?.id).toBeTruthy();

    const blockedJournal = await http(app.getHttpServer())
      .post(`/api/companies/${company.id}/journals`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        date: '2026-03-15',
        narration: 'locked-period test',
        lines: [
          { debit_ledger_id: cash.id, amount: '100.00' },
          { credit_ledger_id: sales.id, amount: '100.00' },
        ],
      });

    expect(blockedJournal.status).toBe(400);
    expect(String(blockedJournal.body?.message ?? blockedJournal.body?.error?.message ?? '')).toContain(
      'Accounting period locked through 2026-03-31',
    );
  });
});
