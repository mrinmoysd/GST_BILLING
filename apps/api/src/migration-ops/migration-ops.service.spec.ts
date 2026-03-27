import { MigrationOpsService } from './migration-ops.service';

describe('MigrationOpsService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('marks failed webhook deliveries as retrying with a next retry time', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'server exploded',
    } as any);

    const prisma = {
      outboundWebhookEndpoint: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'endpoint-1',
            companyId: 'company-1',
            url: 'https://example.com/webhook',
            secretHash: 'shared_secret',
            status: 'active',
            subscribedEvents: ['invoice.issued'],
          },
        ]),
        update: jest.fn().mockResolvedValue({}),
      },
      outboundWebhookDelivery: {
        create: jest.fn().mockResolvedValue({ id: 'delivery-1' }),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'delivery-1', ...data }),
        ),
      },
    };

    const service = new MigrationOpsService(prisma as any, {} as any, {} as any);

    await service.publishWebhookEvent('company-1', 'invoice.issued', 'invoice:1:issued', {
      invoice_id: 'invoice-1',
    });

    expect(prisma.outboundWebhookDelivery.create).toHaveBeenCalled();
    expect(prisma.outboundWebhookDelivery.update).toHaveBeenCalledWith({
      where: { id: 'delivery-1' },
      data: expect.objectContaining({
        responseStatus: 500,
        status: 'retrying',
        nextRetryAt: expect.any(Date),
      }),
    });
  });

  it('retries an existing webhook delivery and increments the attempt count', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'ok',
    } as any);

    const prisma = {
      outboundWebhookEndpoint: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'endpoint-1',
            companyId: 'company-1',
            url: 'https://example.com/webhook',
            secretHash: 'shared_secret',
            status: 'active',
            subscribedEvents: ['invoice.issued'],
          })
          .mockResolvedValueOnce({
            id: 'endpoint-1',
            companyId: 'company-1',
            url: 'https://example.com/webhook',
            secretHash: 'shared_secret',
            status: 'active',
            subscribedEvents: ['invoice.issued'],
          }),
        update: jest.fn().mockResolvedValue({}),
      },
      outboundWebhookDelivery: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'delivery-1',
          companyId: 'company-1',
          endpointId: 'endpoint-1',
          eventType: 'invoice.issued',
          eventKey: 'invoice:1:issued',
          requestBodyJson: {
            event_type: 'invoice.issued',
            event_key: 'invoice:1:issued',
            company_id: 'company-1',
            payload: { invoice_id: 'invoice-1' },
          },
          attemptCount: 1,
          status: 'retrying',
        }),
        update: jest
          .fn()
          .mockImplementationOnce(({ data }) => Promise.resolve({ id: 'delivery-1', ...data }))
          .mockImplementationOnce(({ data }) => Promise.resolve({ id: 'delivery-1', ...data })),
      },
    };

    const service = new MigrationOpsService(prisma as any, {} as any, {} as any);

    await service.retryWebhookDelivery('company-1', 'endpoint-1', 'delivery-1');

    expect(prisma.outboundWebhookDelivery.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { id: 'delivery-1' },
        data: expect.objectContaining({
          attemptCount: 2,
          status: 'pending',
        }),
      }),
    );
    expect(prisma.outboundWebhookDelivery.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { id: 'delivery-1' },
        data: expect.objectContaining({
          responseStatus: 200,
          status: 'delivered',
        }),
      }),
    );
  });

  it('builds receipt preview data from invoice records', async () => {
    const prisma = {
      printTemplate: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'template-1',
          companyId: 'company-1',
          templateType: 'receipt',
          publishedVersionId: 'version-1',
          versions: [
            {
              id: 'version-1',
              versionNo: 1,
              layoutJson: {
                header: { title: 'Retail receipt' },
                sections: [{ key: 'party' }, { key: 'items' }, { key: 'totals' }],
              },
            },
          ],
        }),
      },
      company: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'company-1',
          name: 'GST Billing',
          gstin: '27ABCDE1234F1Z5',
        }),
      },
      invoice: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'invoice-1',
          invoiceNumber: 'INV-001',
          status: 'issued',
          issueDate: new Date('2026-03-27'),
          subTotal: 100,
          taxTotal: 18,
          total: 118,
          customer: { name: 'Retail counter', gstin: null, phone: '9999999999' },
          items: [
            {
              quantity: 2,
              freeQuantity: 0,
              totalQuantity: 2,
              unitPrice: 50,
              lineTotal: 100,
              product: { name: 'Orange Juice', sku: 'SKU-1' },
            },
          ],
        }),
      },
    };

    const service = new MigrationOpsService(prisma as any, {} as any, {} as any);

    const result = await service.previewPrintTemplate('company-1', 'template-1', {
      document_type: 'receipt',
      document_id: 'invoice-1',
    });

    expect(result.data.preview).toEqual(
      expect.objectContaining({
        company: expect.objectContaining({ name: 'GST Billing' }),
        document: expect.objectContaining({ number: 'INV-001' }),
        party: expect.objectContaining({ name: 'Retail counter' }),
        totals: expect.objectContaining({ total: 118 }),
      }),
    );
  });
});
