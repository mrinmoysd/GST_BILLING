import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { CompaniesUsersController } from './companies-users.controller';
import { RolesController } from './roles.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CompaniesUsersController, RolesController],
})
export class UsersModule {}
