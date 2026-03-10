import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as { isSuperAdmin?: boolean; roles?: string[] };

    // Prefer explicit flag if present.
    if (user?.isSuperAdmin === true) return true;

    // Fallback: allow role name based authorization.
    if (Array.isArray(user?.roles) && user.roles.includes('super_admin')) {
      return true;
    }

    return false;
  }
}
