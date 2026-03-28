import * as bcrypt from 'bcryptjs';

import { PrismaClient } from '@prisma/client';
import {
  DEFAULT_SEED_COMPANY_ID,
  DEFAULT_SEED_OWNER_USER_ID,
  DEFAULT_SEED_SUPER_ADMIN_USER_ID,
} from '../seed/seed.constants';

async function main() {
  const prisma = new PrismaClient();
  const email = process.env.SEED_ADMIN_EMAIL ?? 'owner@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'password123';
  const companyName = process.env.SEED_COMPANY_NAME ?? 'Demo Company';
  const superAdminEmail =
    process.env.SEED_SUPER_ADMIN_EMAIL ?? 'superadmin@example.com';
  const superAdminPassword =
    process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'password123';

  const company = await prisma.company.upsert({
    where: {
      id: process.env.SEED_COMPANY_ID ?? DEFAULT_SEED_COMPANY_ID,
    },
    create: {
      id: process.env.SEED_COMPANY_ID ?? DEFAULT_SEED_COMPANY_ID,
      name: companyName,
      businessType: 'retailer',
    },
    update: {
      name: companyName,
    },
  });

  const passwordHash = await bcrypt.hash(password, 10);
  const superAdminPasswordHash = await bcrypt.hash(superAdminPassword, 10);

  await prisma.user.upsert({
    where: {
      id: process.env.SEED_USER_ID ?? DEFAULT_SEED_OWNER_USER_ID,
    },
    create: {
      id: process.env.SEED_USER_ID ?? DEFAULT_SEED_OWNER_USER_ID,
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

  await prisma.user.upsert({
    where: {
      id: process.env.SEED_SUPER_ADMIN_USER_ID ?? DEFAULT_SEED_SUPER_ADMIN_USER_ID,
    },
    create: {
      id: process.env.SEED_SUPER_ADMIN_USER_ID ?? DEFAULT_SEED_SUPER_ADMIN_USER_ID,
      companyId: null,
      email: superAdminEmail,
      name: 'Super Admin',
      passwordHash: superAdminPasswordHash,
      role: 'super_admin',
      isActive: true,
    },
    update: {
      companyId: null,
      email: superAdminEmail,
      name: 'Super Admin',
      passwordHash: superAdminPasswordHash,
      role: 'super_admin',
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
  console.log(
    `Seeded company=${company.id} user=${email} super_admin=${superAdminEmail}`,
  );
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
