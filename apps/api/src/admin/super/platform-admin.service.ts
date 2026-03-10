import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlatformAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listCompanies(args: { page: number; limit: number; q?: string }) {
    const skip = (args.page - 1) * args.limit;

    const where = args.q
      ? {
          OR: [
            { name: { contains: args.q, mode: 'insensitive' as const } },
            { gstin: { contains: args.q, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [total, rows] = await Promise.all([
      this.prisma.company.count({ where }),
      this.prisma.company.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: args.limit,
      }),
    ]);

    return { total, rows };
  }

  async listSubscriptions(args: {
    page: number;
    limit: number;
    status?: string;
  }) {
    const skip = (args.page - 1) * args.limit;

    const where = args.status ? { status: args.status } : {};

    const [total, rows] = await Promise.all([
      this.prisma.subscription.count({ where }),
      this.prisma.subscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: args.limit,
      }),
    ]);

    return { total, rows };
  }

  async usageSummary(args: { from?: Date; to?: Date }) {
    // MVP: usage meters are stored but we don't yet have a usage_events table,
    // so return a basic rollup placeholder.
    const meters = await this.prisma.usageMeter.findMany({
      orderBy: { id: 'desc' },
    });

    return {
      from: args.from?.toISOString() ?? null,
      to: args.to?.toISOString() ?? null,
      meters,
    };
  }
}
