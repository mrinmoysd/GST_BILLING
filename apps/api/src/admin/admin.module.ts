import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { QueuesAdminController } from './queues.controller';

@Module({
  imports: [JobsModule],
  controllers: [QueuesAdminController],
})
export class AdminModule {}
