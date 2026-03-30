import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { REQUIRED_ADMIN_PERMISSIONS_KEY } from './require-admin-permissions.decorator';

@Injectable()
export class AdminPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(
        REQUIRED_ADMIN_PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    if (requiredPermissions.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const userPermissions = Array.isArray(req.user?.permissions)
      ? (req.user.permissions as string[])
      : [];

    const missing = requiredPermissions.filter(
      (permission) => !userPermissions.includes(permission),
    );

    if (missing.length > 0) {
      throw new ForbiddenException('Missing required admin permission');
    }

    return true;
  }
}
