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

describe('Phase I - Platform Integrations (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.FILE_SIGNING_SECRET = 'phase-k-file-signing-secret';

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

  it('supports notifications outbox, file upload/download, and table-backed admin audit history', async () => {
    const password = 'P@ssw0rd!' + Date.now();

    const company = await prisma.company.create({
      data: { name: rnd('platform_co'), businessType: 'RETAIL' },
    });

    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        email: `${rnd('platform_user')}@example.com`,
        name: 'Platform User',
        role: 'ADMIN',
        passwordHash: password,
      },
    });

    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash },
    });

    const loginRes = await http(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user.email, password })
      .expect(200);

    const accessToken = loginRes.body?.data?.access_token;
    expect(accessToken).toBeTruthy();
    const companyId = company.id;

    const templateRes = await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/notification-templates`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        code: 'phase_k_test',
        channel: 'email',
        subject: 'Hello {{name}}',
        body: 'Hi {{name}}, this is a delivery test.',
      })
      .expect(201);

    expect(templateRes.body.data.code).toBe('phase_k_test');

    const enqueueRes = await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/notifications/test`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        template_code: 'phase_k_test',
        channel: 'email',
        to_address: 'phase-k@example.com',
        sample_payload: { name: 'Phase K' },
      })
      .expect(201);

    expect(enqueueRes.body.data.status).toBe('queued');

    const processRes = await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/notifications/process`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    expect(processRes.body.data.processed_count).toBeGreaterThanOrEqual(1);

    const outboxRes = await http(app.getHttpServer())
      .get(`/api/companies/${companyId}/notifications/outbox`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(outboxRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(outboxRes.body.data[0].status).toBe('sent');

    const signRes = await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/files/sign-upload`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'attachment',
        mime_type: 'text/plain',
        size_bytes: 11,
      })
      .expect(201);

    const fileId = signRes.body.data.file_id;
    const token = signRes.body.data.token;
    expect(fileId).toBeTruthy();
    expect(token).toBeTruthy();

    await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/files/upload?token=${encodeURIComponent(token)}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Content-Type', 'text/plain')
      .send('hello world')
      .expect(201);

    const fileRes = await http(app.getHttpServer())
      .get(`/api/companies/${companyId}/files/${fileId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(fileRes.body.data.download_url).toContain(`/files/${fileId}/content`);

    const contentRes = await http(app.getHttpServer())
      .get(`/api/companies/${companyId}/files/${fileId}/content`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(String(contentRes.text ?? '')).toContain('hello world');

    const roleRes = await http(app.getHttpServer())
      .post(`/api/companies/${companyId}/roles`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Phase K Supervisor',
        permission_codes: ['sales.view', 'settings.view'],
      })
      .expect(201);

    expect(roleRes.body.data.name).toBe('Phase K Supervisor');

    const auditRes = await http(app.getHttpServer())
      .get(`/api/companies/${companyId}/roles/audit`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(auditRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(auditRes.body.data[0].summary).toBeTruthy();
  });
});
