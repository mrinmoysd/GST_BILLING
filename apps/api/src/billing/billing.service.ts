import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  private getStripeSecretKey() {
    const secret = process.env.BILLING_STRIPE_SECRET_KEY;
    if (!secret) {
      throw new BadRequestException('BILLING_STRIPE_SECRET_KEY is not configured');
    }
    return secret;
  }

  private getRazorpayCredentials() {
    const keyId = process.env.BILLING_RAZORPAY_KEY_ID;
    const keySecret = process.env.BILLING_RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new BadRequestException(
        'BILLING_RAZORPAY_KEY_ID and BILLING_RAZORPAY_KEY_SECRET are required',
      );
    }
    return { keyId, keySecret };
  }

  verifyWebhookSignature(args: {
    provider: 'stripe' | 'razorpay';
    payloadRaw: string;
    signatureHeader?: string;
  }) {
    const header = String(args.signatureHeader ?? '').trim();
    const secret = this.getWebhookSecret(args.provider);

    if (args.provider === 'stripe') {
      const segments = header.split(',').map((part) => part.trim());
      const timestamp = segments.find((part) => part.startsWith('t='))?.slice(2);
      const signature = segments.find((part) => part.startsWith('v1='))?.slice(3);
      if (!timestamp || !signature) return false;
      const expected = hmacSha256Hex(
        secret,
        `${timestamp}.${args.payloadRaw}`,
      );
      return safeEqualHex(signature, expected);
    }

    if (!header) return false;
    const provided = header.startsWith('sha256=') ? header.slice(7) : header;
    const expected = hmacSha256Hex(secret, args.payloadRaw);
    return safeEqualHex(provided, expected);
  }

  async getSubscription(companyId: string) {
    return this.prisma.subscription.findFirst({
      where: { companyId },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  private async getPlanOrThrow(planCode?: string | null) {
    if (!planCode) throw new BadRequestException('plan_code is required');

    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: { code: planCode, isActive: true },
    });
    if (!plan) throw new NotFoundException('Subscription plan not found');
    return plan;
  }

  private async syncSubscriptionUsage(companyId: string) {
    const activeCount = await this.prisma.subscription.count({
      where: {
        companyId,
        status: { in: ['active', 'trialing'] },
      },
    });

    const now = new Date();
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const periodEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
    );

    await this.prisma.usageMeter.upsert({
      where: {
        companyId_periodStart_periodEnd_key: {
          companyId,
          periodStart,
          periodEnd,
          key: 'active_subscription_count',
        },
      },
      update: {
        value: activeCount,
        updatedAt: new Date(),
      },
      create: {
        companyId,
        periodStart,
        periodEnd,
        key: 'active_subscription_count',
        value: activeCount,
      },
    });
  }

  private async createStripeCheckoutSession(args: {
    companyId: string;
    subscriptionId: string;
    plan: {
      code: string;
      name: string;
      priceInr: any;
      billingInterval: string;
    };
    successUrl?: string | null;
    cancelUrl?: string | null;
  }) {
    const secret = this.getStripeSecretKey();
    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('success_url', args.successUrl ?? 'https://example.com/success');
    params.set('cancel_url', args.cancelUrl ?? 'https://example.com/cancel');
    params.set('client_reference_id', args.subscriptionId);
    params.set('metadata[company_id]', args.companyId);
    params.set('metadata[subscription_id]', args.subscriptionId);
    params.set('line_items[0][price_data][currency]', 'inr');
    params.set(
      'line_items[0][price_data][product_data][name]',
      args.plan.name,
    );
    params.set(
      'line_items[0][price_data][unit_amount]',
      String(Math.round(Number(args.plan.priceInr) * 100)),
    );
    params.set(
      'line_items[0][price_data][recurring][interval]',
      args.plan.billingInterval === 'year' ? 'year' : 'month',
    );
    params.set('line_items[0][quantity]', '1');

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${secret}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      throw new BadRequestException('Stripe checkout session creation failed');
    }

    const json = (await res.json()) as {
      id?: string;
      url?: string;
      subscription?: string;
    };

    return {
      checkoutUrl: json.url ?? null,
      providerSubscriptionId:
        typeof json.subscription === 'string' ? json.subscription : null,
      providerSessionId: json.id ?? null,
    };
  }

  private async createRazorpayCheckout(args: {
    companyId: string;
    subscriptionId: string;
    plan: {
      code: string;
      name: string;
      priceInr: any;
    };
    successUrl?: string | null;
    cancelUrl?: string | null;
  }) {
    const { keyId, keySecret } = this.getRazorpayCredentials();
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const res = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        authorization: `Basic ${auth}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(Number(args.plan.priceInr) * 100),
        currency: 'INR',
        description: `${args.plan.name} subscription`,
        callback_url: args.successUrl ?? 'https://example.com/success',
        callback_method: 'get',
        notes: {
          company_id: args.companyId,
          subscription_id: args.subscriptionId,
          cancel_url: args.cancelUrl ?? null,
        },
      }),
    });

    if (!res.ok) {
      throw new BadRequestException('Razorpay checkout creation failed');
    }

    const json = (await res.json()) as {
      id?: string;
      short_url?: string;
    };

    return {
      checkoutUrl: json.short_url ?? null,
      providerSubscriptionId: json.id ?? null,
      providerSessionId: json.id ?? null,
    };
  }

  async createCheckoutSession(args: {
    companyId: string;
    provider: 'stripe' | 'razorpay';
    planCode?: string | null;
    successUrl?: string | null;
    cancelUrl?: string | null;
  }) {
    const plan = await this.getPlanOrThrow(args.planCode);

    const created = await this.prisma.subscription.create({
      data: {
        companyId: args.companyId,
        planId: plan.id,
        plan: plan.code,
        provider: args.provider,
        status: 'checkout_created',
        metadata: {
          success_url: args.successUrl ?? null,
          cancel_url: args.cancelUrl ?? null,
        } as object,
      },
    });

    const checkout =
      args.provider === 'stripe'
        ? await this.createStripeCheckoutSession({
            companyId: args.companyId,
            subscriptionId: created.id,
            plan,
            successUrl: args.successUrl,
            cancelUrl: args.cancelUrl,
          })
        : await this.createRazorpayCheckout({
            companyId: args.companyId,
            subscriptionId: created.id,
            plan,
            successUrl: args.successUrl,
            cancelUrl: args.cancelUrl,
          });

    const updated = await this.prisma.subscription.update({
      where: { id: created.id },
      data: {
        providerSubscriptionId: checkout.providerSubscriptionId,
        status: checkout.checkoutUrl ? 'checkout_created' : 'pending',
        metadata: {
          success_url: args.successUrl ?? null,
          cancel_url: args.cancelUrl ?? null,
          provider_session_id: checkout.providerSessionId,
        } as object,
      },
      select: { id: true, status: true },
    });

    return {
      status: updated.status ?? 'checkout_created',
      checkout_url: checkout.checkoutUrl,
      subscription_id: updated.id,
    };
  }

  async syncSubscriptionUsageForCompany(companyId: string) {
    await this.syncSubscriptionUsage(companyId);
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
    return this.prisma.webhookEvent.create({
      data: {
        provider: args.provider,
        eventType: args.eventType,
        providerEventId: args.providerEventId ?? null,
        companyId: args.companyId ?? null,
        payload: args.payload as object,
        signature: args.signature ?? null,
        status: args.verified ? 'received' : 'rejected',
      },
    });
  }

  private async applyStripeWebhook(payload: any) {
    const eventType = String(payload?.type ?? '');
    const object = payload?.data?.object ?? {};
    const localSubscriptionId =
      object?.metadata?.subscription_id ?? object?.client_reference_id ?? null;

    if (!localSubscriptionId) return;

    const data: any = {};
    if (eventType === 'checkout.session.completed') {
      data.status = 'active';
      data.startedAt = new Date();
      if (typeof object.subscription === 'string') {
        data.providerSubscriptionId = object.subscription;
      }
    }
    if (eventType === 'customer.subscription.updated') {
      data.status = String(object.status ?? 'active');
      if (object.current_period_end) {
        data.expiresAt = new Date(Number(object.current_period_end) * 1000);
      }
    }
    if (eventType === 'customer.subscription.deleted') {
      data.status = 'cancelled';
      data.expiresAt = new Date();
    }
    if (!Object.keys(data).length) return;

    const updated = await this.prisma.subscription.update({
      where: { id: localSubscriptionId },
      data,
      select: { companyId: true },
    });
    await this.syncSubscriptionUsage(updated.companyId);
  }

  private async applyRazorpayWebhook(payload: any) {
    const eventType = String(payload?.event ?? payload?.type ?? '');
    const entity =
      payload?.payload?.payment_link?.entity ??
      payload?.payload?.subscription?.entity ??
      payload?.payload?.payment?.entity ??
      payload?.entity ??
      {};

    const localSubscriptionId =
      entity?.notes?.subscription_id ?? payload?.subscription_id ?? null;
    if (!localSubscriptionId) return;

    const data: any = {};
    if (eventType === 'payment_link.paid' || eventType === 'subscription.activated') {
      data.status = 'active';
      data.startedAt = new Date();
    }
    if (eventType === 'subscription.cancelled') {
      data.status = 'cancelled';
      data.expiresAt = new Date();
    }
    if (!Object.keys(data).length) return;

    const updated = await this.prisma.subscription.update({
      where: { id: localSubscriptionId },
      data,
      select: { companyId: true },
    });
    await this.syncSubscriptionUsage(updated.companyId);
  }

  async processWebhookEvent(args: {
    eventId: string;
    provider: 'stripe' | 'razorpay';
    payload: any;
  }) {
    try {
      if (args.provider === 'stripe') {
        await this.applyStripeWebhook(args.payload);
      } else {
        await this.applyRazorpayWebhook(args.payload);
      }

      await this.prisma.webhookEvent.update({
        where: { id: args.eventId },
        data: {
          status: 'processed',
          processedAt: new Date(),
          error: null,
        },
      });
    } catch (error) {
      await this.prisma.webhookEvent.update({
        where: { id: args.eventId },
        data: {
          status: 'failed',
          processedAt: new Date(),
          error:
            error instanceof Error
              ? error.message
              : 'Webhook processing failed',
        },
      });
      throw error;
    }
  }
}
