import { BadRequestException } from '@nestjs/common';

import { BillingService } from './billing.service';

describe('BillingService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('verifies stripe webhook signatures using timestamped payload signing', () => {
    process.env.BILLING_STRIPE_WEBHOOK_SECRET = 'stripe_secret_12345';

    const svc = new BillingService({} as any);
    const payload = JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed' });
    const timestamp = '1710000000';
    const { createHmac } = require('crypto');
    const signature = createHmac('sha256', process.env.BILLING_STRIPE_WEBHOOK_SECRET)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    const ok = svc.verifyWebhookSignature({
      provider: 'stripe',
      payloadRaw: payload,
      signatureHeader: `t=${timestamp},v1=${signature}`,
    });

    expect(ok).toBe(true);
  });

  it('verifies razorpay webhook signatures using raw payload signing', () => {
    process.env.BILLING_RAZORPAY_WEBHOOK_SECRET = 'razor_secret_12345';

    const svc = new BillingService({} as any);
    const payload = JSON.stringify({ event: 'payment_link.paid', id: 'pl_1' });
    const { createHmac } = require('crypto');
    const signature = createHmac('sha256', process.env.BILLING_RAZORPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    const ok = svc.verifyWebhookSignature({
      provider: 'razorpay',
      payloadRaw: payload,
      signatureHeader: signature,
    });

    expect(ok).toBe(true);
  });

  it('marks webhook events failed when processing throws', async () => {
    const prisma = {
      subscription: {
        update: jest.fn().mockRejectedValue(new BadRequestException('boom')),
      },
      usageMeter: {
        upsert: jest.fn(),
      },
      webhookEvent: {
        update: jest.fn().mockResolvedValue({ id: 'evt_local_1' }),
      },
    };

    const svc = new BillingService(prisma as any);

    await expect(
      svc.processWebhookEvent({
        eventId: 'evt_local_1',
        provider: 'stripe',
        payload: {
          type: 'checkout.session.completed',
          data: {
            object: {
              metadata: { subscription_id: 'sub_local_1' },
            },
          },
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.webhookEvent.update).toHaveBeenCalledWith({
      where: { id: 'evt_local_1' },
      data: expect.objectContaining({
        status: 'failed',
        error: 'boom',
      }),
    });
  });
});
