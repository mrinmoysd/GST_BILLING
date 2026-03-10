import * as bcrypt from 'bcryptjs';

import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const email = process.env.SEED_ADMIN_EMAIL ?? 'owner@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'password123';
  const companyName = process.env.SEED_COMPANY_NAME ?? 'Demo Company';

  const company = await prisma.company.upsert({
    where: {
      id: process.env.SEED_COMPANY_ID ?? '00000000-0000-0000-0000-000000000001',
    },
    create: {
      id: process.env.SEED_COMPANY_ID ?? '00000000-0000-0000-0000-000000000001',
      name: companyName,
      businessType: 'retailer',
    },
    update: {
      name: companyName,
    },
  });

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: {
      id: process.env.SEED_USER_ID ?? '00000000-0000-0000-0000-000000000002',
    },
    create: {
      id: process.env.SEED_USER_ID ?? '00000000-0000-0000-0000-000000000002',
      companyId: company.id,
      email,
      name: 'Owner',
      passwordHash,
      role: 'owner',
      isActive: true,
    },
    update: {
      companyId: company.id,
      email,
      passwordHash,
      role: 'owner',
      isActive: true,
    },
  });

  // Phase 03 prerequisite: ensure a DEFAULT invoice series exists.
  await prisma.invoiceSeries.upsert({
    where: {
      companyId_code: {
        companyId: company.id,
        code: 'DEFAULT',
      },
    },
    update: { isActive: true },
    create: {
      companyId: company.id,
      code: 'DEFAULT',
      prefix: 'INV-',
      nextNumber: 1,
      isActive: true,
    },
  });

  await prisma.$disconnect();

  // eslint-disable-next-line no-console
  console.log(`Seeded company=${company.id} user=${email}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
