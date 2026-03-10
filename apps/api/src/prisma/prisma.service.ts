import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // Prisma v5 doesn't support the 'beforeExit' event in the same way as older versions.
    // We'll keep shutdown hooks simple and rely on Nest process shutdown.
    void app; // avoid unused param warnings
  }
}
