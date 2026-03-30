import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { BillingEnforcementService } from '../../billing/billing-enforcement.service';
import { AuthUserPayload } from './auth-user.decorator';

@Injectable()
export class CompanyScopeGuard implements CanActivate {
  constructor(
    private readonly billingEnforcement: BillingEnforcementService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as AuthUserPayload | undefined;
    const companyId = req.params?.companyId as string | undefined;

    if (!companyId) throw new BadRequestException('companyId is required');
    if (!user?.companyId) throw new ForbiddenException('No company scope');
    if (user.companyId !== companyId)
      throw new ForbiddenException('Company scope mismatch');

    await this.billingEnforcement.assertCompanyWriteAllowed({
      companyId,
      method: req.method,
      path: req.originalUrl ?? req.url,
    });

    return true;
  }
}
