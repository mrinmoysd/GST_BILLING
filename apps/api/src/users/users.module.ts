import { Module } from '@nestjs/common';

import { BillingModule } from '../billing/billing.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';
import { CompaniesUsersController } from './companies-users.controller';
import { RolesController } from './roles.controller';

@Module({
  imports: [PrismaModule, RbacModule, BillingModule],
  controllers: [CompaniesUsersController, RolesController],
})
export class UsersModule {}
