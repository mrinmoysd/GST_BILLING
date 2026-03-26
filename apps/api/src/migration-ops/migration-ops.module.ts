import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';
import { AccountingModule } from '../accounting/accounting.module';
import { MigrationOpsController } from './migration-ops.controller';
import { MigrationOpsService } from './migration-ops.service';

@Module({
  imports: [PrismaModule, InventoryModule, AccountingModule],
  controllers: [MigrationOpsController],
  providers: [MigrationOpsService],
  exports: [MigrationOpsService],
})
export class MigrationOpsModule {}
