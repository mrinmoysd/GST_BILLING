import {
  BadRequestException,
  Controller,
  Headers,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { BillingService } from './billing.service';
import {
  getRawBodyUtf8,
  type RawBodyRequest,
} from './raw-body-json.middleware';

@ApiTags('Billing')
@Controller('/api/billing/webhooks')
export class BillingWebhookController {
  constructor(private readonly billing: BillingService) {}

  @Post('/:provider')
  async webhook(
    @Param('provider') provider: string,
    @Req() req: Request,
    @Headers('x-signature') xSignature?: string,
  ) {
    if (provider !== 'stripe' && provider !== 'razorpay') {
      throw new BadRequestException('Unknown provider');
    }

    const rawBody = getRawBodyUtf8(req as RawBodyRequest);
    const payloadRaw =
      rawBody ||
      (typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body ?? {}));

    const verified = this.billing.verifyWebhookSignature({
      provider,
      payloadRaw,
      signatureHeader: xSignature,
    });

    await this.billing.storeWebhookEvent({
      provider,
      eventType: String((req.body as any)?.type ?? 'unknown'),
      providerEventId: String((req.body as any)?.id ?? ''),
      companyId: (req.body as any)?.company_id ?? null,
      payload: (req.body ?? {}) as object,
      signature: xSignature ?? null,
      verified,
    });

    if (!verified) throw new BadRequestException('Invalid signature');

    return { ok: true };
  }
}
