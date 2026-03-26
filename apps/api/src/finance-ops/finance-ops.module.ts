import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FinanceOpsController } from './finance-ops.controller';
import { FinanceOpsService } from './finance-ops.service';

@Module({
  imports: [PrismaModule],
  controllers: [FinanceOpsController],
  providers: [FinanceOpsService],
  exports: [FinanceOpsService],
})
export class FinanceOpsModule {}
