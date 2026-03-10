import { BadRequestException, Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

function hmacSha256Hex(secret: string, data: string) {
  return createHmac('sha256', secret).update(data).digest('hex');
}

function safeEqualHex(a: string, b: string) {
  const aa = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  private getWebhookSecret(provider: 'stripe' | 'razorpay') {
    const key =
      provider === 'stripe'
        ? 'BILLING_STRIPE_WEBHOOK_SECRET'
        : 'BILLING_RAZORPAY_WEBHOOK_SECRET';
    const secret = process.env[key];
    if (!secret) {
      throw new BadRequestException(`${key} is not configured`);
    }
    return secret;
  }

  verifyWebhookSignature(args: {
    provider: 'stripe' | 'razorpay';
    payloadRaw: string;
    signatureHeader?: string;
  }) {
    // Simple canonical scheme:
    // signature header = "sha256=<hex_hmac>"
    const header = String(args.signatureHeader ?? '').trim();
    const prefix = 'sha256=';
    if (!header.startsWith(prefix)) return false;

    const provided = header.slice(prefix.length);
    const secret = this.getWebhookSecret(args.provider);
    const expected = hmacSha256Hex(secret, args.payloadRaw);
    return safeEqualHex(provided, expected);
  }

  async storeWebhookEvent(args: {
    provider: 'stripe' | 'razorpay';
    eventType: string;
    providerEventId?: string;
    companyId?: string | null;
    payload: object;
    signature?: string | null;
    verified: boolean;
  }) {
    const rec = await this.prisma.webhookEvent.create({
      data: {
        provider: args.provider,
        eventType: args.eventType,
        providerEventId: args.providerEventId ?? null,
        companyId: args.companyId ?? null,
        payload: args.payload as object,
        signature: args.signature ?? null,
        status: args.verified ? 'received' : 'rejected',
      },
      select: { id: true, status: true },
    });

    return rec;
  }
}
