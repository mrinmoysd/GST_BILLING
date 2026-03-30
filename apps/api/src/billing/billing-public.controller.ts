import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { BillingService } from './billing.service';

@ApiTags('Billing')
@Controller('/api/billing')
export class BillingPublicController {
  constructor(private readonly billing: BillingService) {}

  @Get('/plans')
  async plans() {
    return { ok: true, data: await this.billing.listPublicPlans() };
  }
}
