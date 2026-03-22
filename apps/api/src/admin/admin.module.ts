import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { PrismaModule } from '../prisma/prisma.module';
import { QueuesAdminController } from './queues.controller';

@Module({
  imports: [JobsModule, PrismaModule],
  controllers: [QueuesAdminController],
})
export class AdminModule {}
