import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { isInternalAdminRole } from './admin-roles.constants';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as {
      scope?: string;
      isSuperAdmin?: boolean;
      roles?: string[];
      permissions?: string[];
    };

    if (user?.scope !== 'admin') return false;

    // Prefer explicit flag if present.
    if (user?.isSuperAdmin === true) return true;

    if (
      Array.isArray(user?.permissions) &&
      user.permissions.includes('admin.access')
    ) {
      return true;
    }

    // Fallback: allow role name based authorization.
    if (
      Array.isArray(user?.roles) &&
      user.roles.some((role) => isInternalAdminRole(role))
    ) {
      return true;
    }

    return false;
  }
}
