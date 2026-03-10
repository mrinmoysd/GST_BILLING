import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

import { AuthUserPayload } from './auth-user.decorator';

@Injectable()
export class CompanyAdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as (AuthUserPayload & { role?: string }) | undefined;

    const role = user?.role;
    if (role === 'owner' || role === 'admin') return true;

    throw new ForbiddenException('Insufficient permissions');
  }
}
