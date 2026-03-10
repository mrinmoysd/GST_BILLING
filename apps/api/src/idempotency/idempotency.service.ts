import { ConflictException, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  hashRequest(payload: unknown): string {
    const json = JSON.stringify(payload ?? null);
    return createHash('sha256').update(json).digest('hex');
  }

  /**
   * Contract:
   * - If key is missing: run action.
   * - If key exists with same hash: return stored response.
   * - If key exists with different hash: throw 409.
   */
  async run<T>(args: {
    companyId: string;
    route: string;
    key?: string;
    requestBody: unknown;
    action: () => Promise<{ status: number; body: any; data: T }>;
  }): Promise<{ status: number; body: any; data: T; replayed: boolean }> {
    const { companyId, route, key, requestBody, action } = args;

    if (!key) {
      const res = await action();
      return { ...res, replayed: false };
    }

    const requestHash = this.hashRequest(requestBody);

    const existing = await this.prisma.idempotencyKey.findUnique({
      where: {
        companyId_key_route: {
          companyId,
          key,
          route,
        },
      },
    });

    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new ConflictException(
          'Idempotency-Key reuse with different payload',
        );
      }

      return {
        status: existing.responseCode,
        body: existing.responseBody,
        data: (existing.responseBody as any)?.data,
        replayed: true,
      };
    }

    const res = await action();

    await this.prisma.idempotencyKey.create({
      data: {
        companyId,
        key,
        route,
        requestHash,
        responseCode: res.status,
        responseBody: res.body,
      },
    });

    return { ...res, replayed: false };
  }
}
