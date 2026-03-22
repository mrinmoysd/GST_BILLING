import { Module } from '@nestjs/common';

import { PermissionGuard } from '../common/auth/permission.guard';
import { RbacService } from './rbac.service';

@Module({
  providers: [RbacService, PermissionGuard],
  exports: [RbacService, PermissionGuard],
})
export class RbacModule {}
