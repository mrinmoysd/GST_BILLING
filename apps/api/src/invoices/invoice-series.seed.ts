import { PrismaClient } from '@prisma/client';
import { DEFAULT_SEED_COMPANY_ID } from '../seed/seed.constants';

async function main() {
  const prisma = new PrismaClient();
  try {
    const companyId = process.env.SEED_COMPANY_ID ?? DEFAULT_SEED_COMPANY_ID;

    await prisma.invoiceSeries.upsert({
      where: {
        companyId_code: { companyId, code: 'DEFAULT' },
      },
      update: { isActive: true },
      create: {
        companyId,
        code: 'DEFAULT',
        prefix: 'INV-',
        nextNumber: 1,
        isActive: true,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
