import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const companyId = '00000000-0000-0000-0000-000000000001';

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
