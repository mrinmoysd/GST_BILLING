import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type Purchase, type Invoice } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import * as XLSX from 'xlsx';
import { createHash, createHmac, randomBytes } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { AccountingService } from '../accounting/accounting.service';
import {
  CreateCustomFieldDto,
  CreateImportProfileDto,
  CreateIntegrationApiKeyDto,
  CreateMigrationProjectDto,
  CreatePrintTemplateDto,
  CreatePrintTemplateVersionDto,
  CreateWebhookEndpointDto,
  PreviewPrintTemplateDto,
  SetCustomFieldValueDto,
  TestWebhookEndpointDto,
  UpdateCustomFieldDto,
  UpdateImportProfileDto,
  UpdateMigrationProjectDto,
  UpdateWebhookEndpointDto,
  UploadImportJobDto,
} from './migration-ops.dto';

type ImportTemplateDefinition = {
  entityType: string;
  title: string;
  columns: string[];
  sample: Record<string, unknown>;
};

type RowValidationResult = {
  normalized: Record<string, unknown> | null;
  status: 'valid' | 'warning' | 'error';
  errors: string[];
  warnings: string[];
  action: 'create' | 'update' | 'skip';
};

type WorkbookRow = Record<string, unknown>;

const TEMPLATE_DEFINITIONS: ImportTemplateDefinition[] = [
  {
    entityType: 'customers',
    title: 'Customers',
    columns: [
      'external_code',
      'name',
      'gstin',
      'phone',
      'email',
      'state_code',
      'billing_address_line1',
      'shipping_address_line1',
      'pricing_tier',
      'credit_limit',
    ],
    sample: {
      external_code: 'CUST-001',
      name: 'Sharma Traders',
      gstin: '27ABCDE1234F1Z5',
      phone: '9876543210',
      email: 'accounts@sharmatraders.in',
      state_code: '27',
      billing_address_line1: 'Market Road',
      shipping_address_line1: 'Godown Road',
      pricing_tier: 'wholesale-a',
      credit_limit: '50000',
    },
  },
  {
    entityType: 'suppliers',
    title: 'Suppliers',
    columns: [
      'external_code',
      'name',
      'gstin',
      'phone',
      'email',
      'state_code',
      'address_line1',
    ],
    sample: {
      external_code: 'SUP-001',
      name: 'Prime Foods Pvt Ltd',
      gstin: '27ABCDE1234F2Z4',
      phone: '9820000000',
      email: 'ops@primefoods.in',
      state_code: '27',
      address_line1: 'MIDC Industrial Area',
    },
  },
  {
    entityType: 'categories',
    title: 'Categories',
    columns: ['name'],
    sample: { name: 'Beverages' },
  },
  {
    entityType: 'products',
    title: 'Products',
    columns: [
      'external_code',
      'sku',
      'name',
      'category_name',
      'hsn',
      'price',
      'cost_price',
      'tax_rate',
      'batch_tracking_enabled',
      'expiry_tracking_enabled',
      'batch_issue_policy',
      'near_expiry_days',
    ],
    sample: {
      external_code: 'PROD-001',
      sku: 'SKU-1001',
      name: 'Orange Juice 1L',
      category_name: 'Beverages',
      hsn: '22029920',
      price: '120',
      cost_price: '85',
      tax_rate: '18',
      batch_tracking_enabled: 'true',
      expiry_tracking_enabled: 'true',
      batch_issue_policy: 'FEFO',
      near_expiry_days: '30',
    },
  },
  {
    entityType: 'warehouses',
    title: 'Warehouses',
    columns: ['external_code', 'code', 'name', 'location_label', 'is_default'],
    sample: {
      external_code: 'WH-001',
      code: 'MAIN',
      name: 'Main Warehouse',
      location_label: 'Head office godown',
      is_default: 'true',
    },
  },
  {
    entityType: 'ledgers',
    title: 'Ledgers',
    columns: ['external_code', 'account_code', 'account_name', 'type'],
    sample: {
      external_code: 'LED-001',
      account_code: '6100',
      account_name: 'Freight Outward',
      type: 'direct_expense',
    },
  },
  {
    entityType: 'opening_stock',
    title: 'Opening Stock',
    columns: [
      'product_sku',
      'product_external_code',
      'warehouse_code',
      'quantity',
      'rate',
      'batch_number',
      'expiry_date',
      'manufacturing_date',
    ],
    sample: {
      product_sku: 'SKU-1001',
      product_external_code: 'PROD-001',
      warehouse_code: 'MAIN',
      quantity: '100',
      rate: '85',
      batch_number: 'B001',
      expiry_date: '2026-09-30',
      manufacturing_date: '2026-01-01',
    },
  },
  {
    entityType: 'customer_opening_outstanding',
    title: 'Customer Opening Outstanding',
    columns: [
      'customer_external_code',
      'customer_name',
      'invoice_number',
      'issue_date',
      'due_date',
      'total',
      'amount_paid',
      'notes',
    ],
    sample: {
      customer_external_code: 'CUST-001',
      customer_name: 'Sharma Traders',
      invoice_number: 'OPEN-AR-001',
      issue_date: '2026-03-31',
      due_date: '2026-04-15',
      total: '25000',
      amount_paid: '5000',
      notes: 'Imported opening receivable',
    },
  },
  {
    entityType: 'supplier_opening_outstanding',
    title: 'Supplier Opening Outstanding',
    columns: [
      'supplier_external_code',
      'supplier_name',
      'bill_number',
      'purchase_date',
      'total',
      'amount_paid',
      'notes',
    ],
    sample: {
      supplier_external_code: 'SUP-001',
      supplier_name: 'Prime Foods Pvt Ltd',
      bill_number: 'OPEN-AP-001',
      purchase_date: '2026-03-31',
      total: '18000',
      amount_paid: '0',
      notes: 'Imported opening payable',
    },
  },
  {
    entityType: 'ledger_openings',
    title: 'Ledger Opening Balances',
    columns: ['ledger_code', 'ledger_name', 'balance_side', 'amount', 'date', 'narration'],
    sample: {
      ledger_code: '6100',
      ledger_name: 'Freight Outward',
      balance_side: 'debit',
      amount: '12500',
      date: '2026-03-31',
      narration: 'Opening balance import',
    },
  },
  {
    entityType: 'open_sales_invoices',
    title: 'Open Sales Invoices',
    columns: [
      'customer_external_code',
      'customer_name',
      'invoice_number',
      'issue_date',
      'due_date',
      'total',
      'amount_paid',
      'notes',
    ],
    sample: {
      customer_external_code: 'CUST-001',
      customer_name: 'Sharma Traders',
      invoice_number: 'SI-0001',
      issue_date: '2026-03-15',
      due_date: '2026-03-30',
      total: '12000',
      amount_paid: '0',
      notes: 'Imported open invoice',
    },
  },
  {
    entityType: 'open_purchase_bills',
    title: 'Open Purchase Bills',
    columns: [
      'supplier_external_code',
      'supplier_name',
      'bill_number',
      'purchase_date',
      'total',
      'amount_paid',
      'notes',
    ],
    sample: {
      supplier_external_code: 'SUP-001',
      supplier_name: 'Prime Foods Pvt Ltd',
      bill_number: 'PB-1001',
      purchase_date: '2026-03-18',
      total: '22000',
      amount_paid: '0',
      notes: 'Imported open purchase bill',
    },
  },
];

const TEMPLATE_LOOKUP = new Map(
  TEMPLATE_DEFINITIONS.map((template) => [template.entityType, template]),
);

const CUSTOM_FIELD_ENTITY_TYPES = new Set([
  'customer',
  'supplier',
  'product',
  'invoice',
  'sales_order',
  'purchase',
]);

const PRINT_TEMPLATE_TYPES = new Set([
  'invoice',
  'quotation',
  'sales_order',
  'challan',
  'receipt',
  'purchase',
]);

const SUPPORTED_WEBHOOK_EVENTS = [
  {
    code: 'integration.test',
    label: 'Manual test delivery',
    description: 'Send a signed test payload to verify endpoint reachability.',
  },
  {
    code: 'import.job.committed',
    label: 'Import job committed',
    description: 'Fire when a migration import job completes its commit step.',
  },
  {
    code: 'invoice.draft_created',
    label: 'Invoice draft created',
    description: 'Fire when a draft invoice is saved.',
  },
  {
    code: 'invoice.issued',
    label: 'Invoice issued',
    description: 'Fire when an invoice is issued and becomes commercial stock/accounting truth.',
  },
  {
    code: 'invoice.cancelled',
    label: 'Invoice cancelled',
    description: 'Fire when an issued invoice is cancelled.',
  },
  {
    code: 'invoice.payment_recorded',
    label: 'Invoice payment recorded',
    description: 'Fire when a receipt is posted against an invoice.',
  },
  {
    code: 'purchase.payment_recorded',
    label: 'Purchase payment recorded',
    description: 'Fire when a payment is posted against a purchase bill.',
  },
  {
    code: 'payment.instrument_updated',
    label: 'Payment instrument updated',
    description: 'Fire when cheque, PDC, or bank instrument details are updated.',
  },
] as const;

const SUPPORTED_WEBHOOK_EVENT_CODES: Set<string> = new Set(
  SUPPORTED_WEBHOOK_EVENTS.map((event) => event.code),
);

@Injectable()
export class MigrationOpsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly accounting: AccountingService,
  ) {}

  private normalizeKey(value: string) {
    return value.trim().toLowerCase().replace(/[\s_-]+/g, '');
  }

  private decimalString(value: unknown, label: string) {
    const raw = String(value ?? '').trim().replace(/,/g, '');
    if (!raw) throw new BadRequestException(`${label} is required`);
    if (!/^[-+]?\d+(\.\d+)?$/.test(raw)) {
      throw new BadRequestException(`${label} is invalid`);
    }
    return raw;
  }

  private optionalDecimalString(value: unknown) {
    const raw = String(value ?? '').trim().replace(/,/g, '');
    if (!raw) return null;
    if (!/^[-+]?\d+(\.\d+)?$/.test(raw)) {
      throw new BadRequestException(`Amount "${value}" is invalid`);
    }
    return raw;
  }

  private parseDateOnly(value: unknown, label: string) {
    const raw = String(value ?? '').trim();
    if (!raw) throw new BadRequestException(`${label} is required`);
    const date = new Date(raw);
    if (Number.isNaN(date.valueOf())) {
      throw new BadRequestException(`${label} is invalid`);
    }
    return date;
  }

  private optionalDateOnly(value: unknown) {
    const raw = String(value ?? '').trim();
    if (!raw) return null;
    const date = new Date(raw);
    if (Number.isNaN(date.valueOf())) {
      throw new BadRequestException(`Date "${value}" is invalid`);
    }
    return date;
  }

  private toBool(value: unknown) {
    const raw = String(value ?? '').trim().toLowerCase();
    if (!raw) return false;
    return ['1', 'true', 'yes', 'y'].includes(raw);
  }

  private stringValue(value: unknown) {
    const raw = String(value ?? '').trim();
    return raw || null;
  }

  private jsonValue(value: unknown) {
    if (value === undefined) return Prisma.JsonNull;
    if (value === null) return Prisma.JsonNull;
    return value as Prisma.InputJsonValue;
  }

  private sha256(input: Buffer | string) {
    return createHash('sha256').update(input).digest('hex');
  }

  private signWebhook(secret: string, body: string) {
    return createHmac('sha256', secret).update(body).digest('hex');
  }

  private serializeWebhookEndpoint(endpoint: {
    id: string;
    name: string;
    url: string;
    status: string;
    subscribedEvents: unknown;
    lastSuccessAt?: Date | null;
    lastFailureAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    return {
      id: endpoint.id,
      name: endpoint.name,
      url: endpoint.url,
      status: endpoint.status,
      subscribed_events: Array.isArray(endpoint.subscribedEvents)
        ? endpoint.subscribedEvents.map(String)
        : [],
      last_success_at: endpoint.lastSuccessAt ?? null,
      last_failure_at: endpoint.lastFailureAt ?? null,
      created_at: endpoint.createdAt ?? null,
      updated_at: endpoint.updatedAt ?? null,
    };
  }

  private serializeApiKey(record: {
    id: string;
    name: string;
    keyPrefix: string;
    status: string;
    lastUsedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    return {
      id: record.id,
      name: record.name,
      key_prefix: record.keyPrefix,
      status: record.status,
      last_used_at: record.lastUsedAt ?? null,
      created_at: record.createdAt ?? null,
      updated_at: record.updatedAt ?? null,
    };
  }

  private templateFor(entityType: string) {
    const template = TEMPLATE_LOOKUP.get(entityType);
    if (!template) {
      throw new BadRequestException(`Unsupported import entity type: ${entityType}`);
    }
    return template;
  }

  private buildCsv(template: ImportTemplateDefinition) {
    const header = template.columns.join(',');
    const sample = template.columns
      .map((column) => {
        const raw = String(template.sample[column] ?? '');
        if (raw.includes(',') || raw.includes('"')) {
          return `"${raw.replace(/"/g, '""')}"`;
        }
        return raw;
      })
      .join(',');
    return `${header}\n${sample}\n`;
  }

  private parseWorkbook(args: {
    fileName?: string | null;
    sourceFormat?: string | null;
    contentBase64?: string | null;
    contentText?: string | null;
  }) {
    const format =
      args.sourceFormat?.trim().toLowerCase() ||
      args.fileName?.split('.').pop()?.trim().toLowerCase() ||
      'csv';

    if (!args.contentBase64 && !args.contentText) {
      throw new BadRequestException('Import content is required');
    }

    let workbook: XLSX.WorkBook;
    let sourceDigest: string;
    if (['xlsx', 'xls'].includes(format)) {
      if (!args.contentBase64) {
        throw new BadRequestException('Excel imports require file_content_base64');
      }
      const buffer = Buffer.from(args.contentBase64, 'base64');
      workbook = XLSX.read(buffer, { type: 'buffer', raw: false });
      sourceDigest = this.sha256(buffer);
    } else {
      const text = args.contentText
        ? args.contentText
        : Buffer.from(args.contentBase64!, 'base64').toString('utf8');
      workbook = XLSX.read(text, { type: 'string', raw: false });
      sourceDigest = this.sha256(text);
    }

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('Import file does not contain any sheet');
    }
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as WorkbookRow[];
    if (!rows.length) {
      throw new BadRequestException('Import file does not contain any data rows');
    }
    return { rows, sourceFormat: format, sourceDigest };
  }

  private normalizeWorkbookRow(
    row: WorkbookRow,
    template: ImportTemplateDefinition,
    mappings: Record<string, string>,
  ) {
    const normalizedInput = Object.entries(row).reduce<Record<string, unknown>>(
      (acc, [key, value]) => {
        acc[this.normalizeKey(key)] = value;
        return acc;
      },
      {},
    );

    const normalized = template.columns.reduce<Record<string, unknown>>((acc, column) => {
      const mapped = mappings[column] ?? column;
      acc[column] = normalizedInput[this.normalizeKey(mapped)];
      return acc;
    }, {});

    return normalized;
  }

  private summarizeRows(
    rows: Array<{
      status: string;
      warningCodes?: unknown;
      errorCodes?: unknown;
    }>,
  ) {
    const summary = {
      total_rows: rows.length,
      valid_rows: 0,
      warning_rows: 0,
      error_rows: 0,
      committed_rows: 0,
      skipped_rows: 0,
    };
    const topErrors = new Map<string, number>();

    for (const row of rows) {
      if (row.status === 'valid') summary.valid_rows += 1;
      if (row.status === 'warning') summary.warning_rows += 1;
      if (row.status === 'error') summary.error_rows += 1;
      if (row.status === 'committed') summary.committed_rows += 1;
      if (row.status === 'skipped') summary.skipped_rows += 1;

      const errorCodes = Array.isArray(row.errorCodes) ? row.errorCodes : [];
      for (const code of errorCodes) {
        const key = String(code);
        topErrors.set(key, (topErrors.get(key) ?? 0) + 1);
      }
    }

    return {
      summary,
      top_errors: Array.from(topErrors.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, 10)
        .map(([code, count]) => ({ code, count })),
    };
  }

  private async ensureProject(companyId: string, projectId?: string | null) {
    if (!projectId) return null;
    const project = await this.prisma.migrationProject.findFirst({
      where: { id: projectId, companyId },
    });
    if (!project) throw new NotFoundException('Migration project not found');
    return project;
  }

  private async ensureProfile(companyId: string, profileId?: string | null) {
    if (!profileId) return null;
    const profile = await this.prisma.importProfile.findFirst({
      where: { id: profileId, companyId },
    });
    if (!profile) throw new NotFoundException('Import profile not found');
    return profile;
  }

  private async ensureImportJob(companyId: string, jobId: string) {
    const job = await this.prisma.importJob.findFirst({
      where: { id: jobId, companyId },
      include: { importProfile: true },
    });
    if (!job) throw new NotFoundException('Import job not found');
    return job;
  }

  private async ensurePrintTemplate(companyId: string, templateId: string) {
    const template = await this.prisma.printTemplate.findFirst({
      where: { id: templateId, companyId },
      include: {
        versions: { orderBy: { versionNo: 'desc' } },
      },
    });
    if (!template) throw new NotFoundException('Print template not found');
    return template;
  }

  private async ensureCustomFieldDefinition(companyId: string, fieldId: string) {
    const definition = await this.prisma.customFieldDefinition.findFirst({
      where: { id: fieldId, companyId },
    });
    if (!definition) throw new NotFoundException('Custom field not found');
    return definition;
  }

  private async ensureWebhookEndpoint(companyId: string, endpointId: string) {
    const endpoint = await this.prisma.outboundWebhookEndpoint.findFirst({
      where: { id: endpointId, companyId },
    });
    if (!endpoint) throw new NotFoundException('Webhook endpoint not found');
    return endpoint;
  }

  private async ensureWebhookDelivery(
    companyId: string,
    endpointId: string,
    deliveryId: string,
  ) {
    const delivery = await this.prisma.outboundWebhookDelivery.findFirst({
      where: { id: deliveryId, companyId, endpointId },
    });
    if (!delivery) throw new NotFoundException('Webhook delivery not found');
    return delivery;
  }

  private nextWebhookRetryAt(attemptCount: number, allowRetry = true) {
    if (!allowRetry) return null;
    const backoffMinutes = [5, 15, 60];
    const delay = backoffMinutes[attemptCount - 1];
    if (!delay) return null;
    return new Date(Date.now() + delay * 60_000);
  }

  private ensureSubscribedWebhookEvents(events?: string[]) {
    const normalized = (events ?? [])
      .map((event) => String(event ?? '').trim())
      .filter(Boolean);
    for (const event of normalized) {
      if (!SUPPORTED_WEBHOOK_EVENT_CODES.has(event)) {
        throw new BadRequestException(`Unsupported webhook event: ${event}`);
      }
    }
    return normalized;
  }

  private async resolvePrintPreviewData(args: {
    companyId: string;
    templateType: string;
    documentType?: string;
    documentId?: string;
  }) {
    const documentType = (args.documentType?.trim() || args.templateType).toLowerCase();
    const company = await this.prisma.company.findFirst({
      where: { id: args.companyId },
      select: { id: true, name: true, gstin: true },
    });

    const fallback = {
      company: {
        id: company?.id ?? args.companyId,
        name: company?.name ?? 'Sample Company',
        gstin: company?.gstin ?? null,
      },
      document: { number: 'SAMPLE-001', date: new Date().toISOString().slice(0, 10) },
      party: { name: 'Sample Party', gstin: '27ABCDE1234F1Z5' },
      items: [],
      totals: { total: 0 },
      meta: { template_type: args.templateType, document_type: documentType },
    } satisfies Record<string, unknown>;

    if (documentType === 'invoice' || documentType === 'receipt') {
      if (!args.documentId) return fallback;
      const invoice = await this.prisma.invoice.findFirst({
        where: { id: args.documentId, companyId: args.companyId },
        include: {
          customer: { select: { name: true, gstin: true, phone: true } },
          items: { include: { product: { select: { name: true, sku: true } } } },
        },
      });
      if (!invoice) return fallback;
      return {
        company: fallback.company,
        document: {
          id: invoice.id,
          number: invoice.invoiceNumber,
          status: invoice.status,
          issue_date: invoice.issueDate,
        },
        party: {
          name: invoice.customer.name,
          gstin: invoice.customer.gstin,
          phone: invoice.customer.phone,
        },
        items: invoice.items.map((item) => ({
          product: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity,
          free_quantity: item.freeQuantity,
          total_quantity: item.totalQuantity,
          rate: item.unitPrice,
          total: item.lineTotal,
        })),
        totals: {
          sub_total: invoice.subTotal,
          tax_total: invoice.taxTotal,
          total: invoice.total,
        },
        meta: { template_type: args.templateType, document_type: documentType },
      } satisfies Record<string, unknown>;
    }

    if (documentType === 'quotation') {
      if (!args.documentId) return fallback;
      const quotation = await this.prisma.quotation.findFirst({
        where: { id: args.documentId, companyId: args.companyId },
        include: {
          customer: { select: { name: true, gstin: true, phone: true } },
          items: { include: { product: { select: { name: true, sku: true } } } },
        },
      });
      if (!quotation) return fallback;
      return {
        company: fallback.company,
        document: {
          id: quotation.id,
          number: quotation.quoteNumber,
          status: quotation.status,
          issue_date: quotation.issueDate,
          expiry_date: quotation.expiryDate,
        },
        party: {
          name: quotation.customer.name,
          gstin: quotation.customer.gstin,
          phone: quotation.customer.phone,
        },
        items: quotation.items.map((item) => ({
          product: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity,
          free_quantity: item.freeQuantity,
          total_quantity: item.totalQuantity,
          rate: item.unitPrice,
          total: item.lineTotal,
        })),
        totals: {
          sub_total: quotation.subTotal,
          tax_total: quotation.taxTotal,
          total: quotation.total,
        },
        meta: { template_type: args.templateType, document_type: documentType },
      } satisfies Record<string, unknown>;
    }

    if (documentType === 'sales_order') {
      if (!args.documentId) return fallback;
      const order = await this.prisma.salesOrder.findFirst({
        where: { id: args.documentId, companyId: args.companyId },
        include: {
          customer: { select: { name: true, gstin: true, phone: true } },
          items: { include: { product: { select: { name: true, sku: true } } } },
        },
      });
      if (!order) return fallback;
      return {
        company: fallback.company,
        document: {
          id: order.id,
          number: order.orderNumber,
          status: order.status,
          order_date: order.orderDate,
          expected_dispatch_date: order.expectedDispatchDate,
        },
        party: {
          name: order.customer.name,
          gstin: order.customer.gstin,
          phone: order.customer.phone,
        },
        items: order.items.map((item) => ({
          product: item.product.name,
          sku: item.product.sku,
          quantity: item.quantityOrdered,
          free_quantity: item.freeQuantity,
          total_quantity: item.totalQuantity,
          fulfilled_quantity: item.quantityFulfilled,
          rate: item.unitPrice,
          total: item.lineTotal,
        })),
        totals: {
          sub_total: order.subTotal,
          tax_total: order.taxTotal,
          total: order.total,
        },
        meta: { template_type: args.templateType, document_type: documentType },
      } satisfies Record<string, unknown>;
    }

    if (documentType === 'purchase') {
      if (!args.documentId) return fallback;
      const purchase = await this.prisma.purchase.findFirst({
        where: { id: args.documentId, companyId: args.companyId },
        include: {
          supplier: { select: { name: true, gstin: true, phone: true } },
          items: { include: { product: { select: { name: true, sku: true } } } },
        },
      });
      if (!purchase) return fallback;
      return {
        company: fallback.company,
        document: {
          id: purchase.id,
          number: purchase.migrationSourceRef ?? purchase.id,
          status: purchase.status,
          purchase_date: purchase.purchaseDate,
        },
        party: {
          name: purchase.supplier.name,
          gstin: purchase.supplier.gstin,
          phone: purchase.supplier.phone,
        },
        items: purchase.items.map((item) => ({
          product: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity,
          rate: item.unitCost,
          total: item.lineTotal,
        })),
        totals: {
          sub_total: purchase.subTotal,
          tax_total: purchase.taxTotal,
          total: purchase.total,
        },
        meta: { template_type: args.templateType, document_type: documentType },
      } satisfies Record<string, unknown>;
    }

    if (documentType === 'challan') {
      if (!args.documentId) return fallback;
      const challan = await this.prisma.deliveryChallan.findFirst({
        where: { id: args.documentId, companyId: args.companyId },
        include: {
          customer: { select: { name: true, gstin: true, phone: true } },
          warehouse: { select: { name: true, code: true } },
          items: { include: { product: { select: { name: true, sku: true } } } },
          salesOrder: { select: { orderNumber: true } },
        },
      });
      if (!challan) return fallback;
      return {
        company: fallback.company,
        document: {
          id: challan.id,
          number: challan.challanNumber,
          status: challan.status,
          challan_date: challan.challanDate,
          transporter_name: challan.transporterName,
          vehicle_number: challan.vehicleNumber,
          order_number: challan.salesOrder.orderNumber,
          warehouse_name: challan.warehouse.name,
        },
        party: {
          name: challan.customer.name,
          gstin: challan.customer.gstin,
          phone: challan.customer.phone,
        },
        items: challan.items.map((item) => ({
          product: item.product.name,
          sku: item.product.sku,
          quantity_requested: item.quantityRequested,
          quantity_dispatched: item.quantityDispatched,
          quantity_delivered: item.quantityDelivered,
          short_supply_quantity: item.shortSupplyQuantity,
        })),
        totals: {
          total_lines: challan.items.length,
        },
        meta: { template_type: args.templateType, document_type: documentType },
      } satisfies Record<string, unknown>;
    }

    return fallback;
  }

  private normalizeGstin(value: unknown) {
    const gstin = this.stringValue(value)?.toUpperCase() ?? null;
    if (gstin && !/^\d{2}[A-Z0-9]{10}[A-Z]\dZ\d$/.test(gstin)) {
      throw new BadRequestException('GSTIN is invalid');
    }
    return gstin;
  }

  private async findCustomer(companyId: string, normalized: Record<string, unknown>) {
    const externalCode = this.stringValue(normalized.external_code);
    const gstin = this.stringValue(normalized.gstin)?.toUpperCase() ?? null;
    const email = this.stringValue(normalized.email)?.toLowerCase() ?? null;
    const name = this.stringValue(normalized.name);
    return this.prisma.customer.findFirst({
      where: {
        companyId,
        deletedAt: null,
        OR: [
          ...(externalCode ? [{ externalCode }] : []),
          ...(gstin ? [{ gstin }] : []),
          ...(email ? [{ email }] : []),
          ...(name ? [{ name }] : []),
        ],
      },
    });
  }

  private async findSupplier(companyId: string, normalized: Record<string, unknown>) {
    const externalCode = this.stringValue(normalized.external_code);
    const gstin = this.stringValue(normalized.gstin)?.toUpperCase() ?? null;
    const name = this.stringValue(normalized.name);
    return this.prisma.supplier.findFirst({
      where: {
        companyId,
        deletedAt: null,
        OR: [
          ...(externalCode ? [{ externalCode }] : []),
          ...(gstin ? [{ gstin }] : []),
          ...(name ? [{ name }] : []),
        ],
      },
    });
  }

  private async findProduct(companyId: string, normalized: Record<string, unknown>) {
    const externalCode =
      this.stringValue(normalized.external_code) ??
      this.stringValue(normalized.product_external_code);
    const sku =
      this.stringValue(normalized.sku) ?? this.stringValue(normalized.product_sku);
    const name = this.stringValue(normalized.name);
    return this.prisma.product.findFirst({
      where: {
        companyId,
        deletedAt: null,
        OR: [
          ...(externalCode ? [{ externalCode }] : []),
          ...(sku ? [{ sku }] : []),
          ...(name ? [{ name }] : []),
        ],
      },
    });
  }

  private async findWarehouse(companyId: string, normalized: Record<string, unknown>) {
    const externalCode = this.stringValue(normalized.external_code);
    const code = this.stringValue(normalized.code) ?? this.stringValue(normalized.warehouse_code);
    const name = this.stringValue(normalized.name);
    return this.prisma.warehouse.findFirst({
      where: {
        companyId,
        OR: [
          ...(externalCode ? [{ externalCode }] : []),
          ...(code ? [{ code }] : []),
          ...(name ? [{ name }] : []),
        ],
      },
    });
  }

  private async findLedger(companyId: string, normalized: Record<string, unknown>) {
    const externalCode = this.stringValue(normalized.external_code);
    const accountCode =
      this.stringValue(normalized.account_code) ??
      this.stringValue(normalized.ledger_code);
    const accountName =
      this.stringValue(normalized.account_name) ??
      this.stringValue(normalized.ledger_name);
    return this.prisma.ledger.findFirst({
      where: {
        companyId,
        OR: [
          ...(externalCode ? [{ externalCode }] : []),
          ...(accountCode ? [{ accountCode }] : []),
          ...(accountName ? [{ accountName }] : []),
        ],
      },
    });
  }

  private async normalizeImportRow(
    companyId: string,
    entityType: string,
    input: Record<string, unknown>,
    mode: string,
  ): Promise<RowValidationResult> {
    const warnings: string[] = [];
    try {
      if (entityType === 'customers') {
        if (!this.stringValue(input.name)) {
          return { normalized: null, status: 'error', errors: ['MISSING_NAME'], warnings, action: 'skip' };
        }
        const existing = await this.findCustomer(companyId, input);
        return {
          normalized: {
            external_code: this.stringValue(input.external_code),
            name: this.stringValue(input.name),
            gstin: this.normalizeGstin(input.gstin),
            phone: this.stringValue(input.phone),
            email: this.stringValue(input.email)?.toLowerCase() ?? null,
            state_code: this.stringValue(input.state_code),
            billing_address: this.stringValue(input.billing_address_line1)
              ? { line1: this.stringValue(input.billing_address_line1) }
              : null,
            shipping_address: this.stringValue(input.shipping_address_line1)
              ? { line1: this.stringValue(input.shipping_address_line1) }
              : null,
            pricing_tier: this.stringValue(input.pricing_tier),
            credit_limit: this.optionalDecimalString(input.credit_limit),
          },
          status: existing && mode === 'create_only' ? 'warning' : 'valid',
          errors: [],
          warnings: existing && mode === 'create_only' ? ['DUPLICATE_WILL_BE_SKIPPED'] : warnings,
          action: existing ? (mode === 'upsert_by_key' ? 'update' : 'skip') : 'create',
        };
      }

      if (entityType === 'suppliers') {
        if (!this.stringValue(input.name)) {
          return { normalized: null, status: 'error', errors: ['MISSING_NAME'], warnings, action: 'skip' };
        }
        const existing = await this.findSupplier(companyId, input);
        return {
          normalized: {
            external_code: this.stringValue(input.external_code),
            name: this.stringValue(input.name),
            gstin: this.normalizeGstin(input.gstin),
            phone: this.stringValue(input.phone),
            email: this.stringValue(input.email)?.toLowerCase() ?? null,
            state_code: this.stringValue(input.state_code),
            address: this.stringValue(input.address_line1)
              ? { line1: this.stringValue(input.address_line1) }
              : null,
          },
          status: existing && mode === 'create_only' ? 'warning' : 'valid',
          errors: [],
          warnings: existing && mode === 'create_only' ? ['DUPLICATE_WILL_BE_SKIPPED'] : warnings,
          action: existing ? (mode === 'upsert_by_key' ? 'update' : 'skip') : 'create',
        };
      }

      if (entityType === 'categories') {
        const name = this.stringValue(input.name);
        if (!name) {
          return { normalized: null, status: 'error', errors: ['MISSING_NAME'], warnings, action: 'skip' };
        }
        const existing = await this.prisma.category.findFirst({
          where: { companyId, name },
        });
        return {
          normalized: { name },
          status: existing && mode === 'create_only' ? 'warning' : 'valid',
          errors: [],
          warnings: existing && mode === 'create_only' ? ['DUPLICATE_WILL_BE_SKIPPED'] : warnings,
          action: existing ? (mode === 'upsert_by_key' ? 'update' : 'skip') : 'create',
        };
      }

      if (entityType === 'products') {
        if (!this.stringValue(input.name)) {
          return { normalized: null, status: 'error', errors: ['MISSING_NAME'], warnings, action: 'skip' };
        }
        const existing = await this.findProduct(companyId, input);
        return {
          normalized: {
            external_code: this.stringValue(input.external_code),
            name: this.stringValue(input.name),
            sku: this.stringValue(input.sku),
            category_name: this.stringValue(input.category_name),
            hsn: this.stringValue(input.hsn),
            price: this.decimalString(input.price, 'price'),
            cost_price: this.optionalDecimalString(input.cost_price) ?? '0',
            tax_rate: this.optionalDecimalString(input.tax_rate),
            batch_tracking_enabled: this.toBool(input.batch_tracking_enabled),
            expiry_tracking_enabled: this.toBool(input.expiry_tracking_enabled),
            batch_issue_policy:
              this.stringValue(input.batch_issue_policy)?.toUpperCase() ?? 'NONE',
            near_expiry_days: this.stringValue(input.near_expiry_days) ?? '0',
          },
          status: existing && mode === 'create_only' ? 'warning' : 'valid',
          errors: [],
          warnings: existing && mode === 'create_only' ? ['DUPLICATE_WILL_BE_SKIPPED'] : warnings,
          action: existing ? (mode === 'upsert_by_key' ? 'update' : 'skip') : 'create',
        };
      }

      if (entityType === 'warehouses') {
        if (!this.stringValue(input.code) || !this.stringValue(input.name)) {
          return { normalized: null, status: 'error', errors: ['MISSING_CODE_OR_NAME'], warnings, action: 'skip' };
        }
        const existing = await this.findWarehouse(companyId, input);
        return {
          normalized: {
            external_code: this.stringValue(input.external_code),
            code: this.stringValue(input.code),
            name: this.stringValue(input.name),
            location_label: this.stringValue(input.location_label),
            is_default: this.toBool(input.is_default),
          },
          status: existing && mode === 'create_only' ? 'warning' : 'valid',
          errors: [],
          warnings: existing && mode === 'create_only' ? ['DUPLICATE_WILL_BE_SKIPPED'] : warnings,
          action: existing ? (mode === 'upsert_by_key' ? 'update' : 'skip') : 'create',
        };
      }

      if (entityType === 'ledgers') {
        if (!this.stringValue(input.account_code) || !this.stringValue(input.account_name) || !this.stringValue(input.type)) {
          return { normalized: null, status: 'error', errors: ['MISSING_LEDGER_FIELDS'], warnings, action: 'skip' };
        }
        const existing = await this.findLedger(companyId, input);
        return {
          normalized: {
            external_code: this.stringValue(input.external_code),
            account_code: this.stringValue(input.account_code),
            account_name: this.stringValue(input.account_name),
            type: this.stringValue(input.type),
          },
          status: existing && mode === 'create_only' ? 'warning' : 'valid',
          errors: [],
          warnings: existing && mode === 'create_only' ? ['DUPLICATE_WILL_BE_SKIPPED'] : warnings,
          action: existing ? (mode === 'upsert_by_key' ? 'update' : 'skip') : 'create',
        };
      }

      if (entityType === 'opening_stock') {
        const product = await this.findProduct(companyId, input);
        const warehouse = await this.findWarehouse(companyId, input);
        if (!product) {
          return { normalized: null, status: 'error', errors: ['PRODUCT_NOT_FOUND'], warnings, action: 'skip' };
        }
        if (!warehouse) {
          return { normalized: null, status: 'error', errors: ['WAREHOUSE_NOT_FOUND'], warnings, action: 'skip' };
        }
        return {
          normalized: {
            product_id: product.id,
            warehouse_id: warehouse.id,
            quantity: this.decimalString(input.quantity, 'quantity'),
            rate: this.optionalDecimalString(input.rate),
            batch_number: this.stringValue(input.batch_number),
            expiry_date: this.stringValue(input.expiry_date),
            manufacturing_date: this.stringValue(input.manufacturing_date),
          },
          status: 'valid',
          errors: [],
          warnings,
          action: 'create',
        };
      }

      if (
        ['customer_opening_outstanding', 'open_sales_invoices'].includes(entityType)
      ) {
        const customer = await this.findCustomer(companyId, {
          external_code:
            this.stringValue(input.customer_external_code) ??
            this.stringValue(input.external_code),
          email: this.stringValue(input.customer_email),
          name: this.stringValue(input.customer_name),
        });
        if (!customer) {
          return { normalized: null, status: 'error', errors: ['CUSTOMER_NOT_FOUND'], warnings, action: 'skip' };
        }
        const invoiceNumber =
          this.stringValue(input.invoice_number) ??
          `OPEN-${customer.id.slice(0, 8)}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const existing = await this.prisma.invoice.findFirst({
          where: { companyId, invoiceNumber },
          select: { id: true },
        });
        if (existing) {
          return {
            normalized: null,
            status: mode === 'create_only' ? 'warning' : 'error',
            errors: mode === 'create_only' ? [] : ['INVOICE_ALREADY_EXISTS'],
            warnings: mode === 'create_only' ? ['DUPLICATE_WILL_BE_SKIPPED'] : [],
            action: 'skip',
          };
        }
        return {
          normalized: {
            customer_id: customer.id,
            invoice_number: invoiceNumber,
            issue_date: this.stringValue(input.issue_date),
            due_date: this.stringValue(input.due_date),
            total: this.decimalString(input.total, 'total'),
            amount_paid: this.optionalDecimalString(input.amount_paid) ?? '0',
            notes: this.stringValue(input.notes),
          },
          status: 'valid',
          errors: [],
          warnings,
          action: 'create',
        };
      }

      if (
        ['supplier_opening_outstanding', 'open_purchase_bills'].includes(entityType)
      ) {
        const supplier = await this.findSupplier(companyId, {
          external_code:
            this.stringValue(input.supplier_external_code) ??
            this.stringValue(input.external_code),
          name: this.stringValue(input.supplier_name),
          gstin: this.stringValue(input.gstin),
        });
        if (!supplier) {
          return { normalized: null, status: 'error', errors: ['SUPPLIER_NOT_FOUND'], warnings, action: 'skip' };
        }
        const billNumber =
          this.stringValue(input.bill_number) ??
          `OPEN-${supplier.id.slice(0, 8)}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const existing = await this.prisma.purchase.findFirst({
          where: { companyId, migrationSourceRef: billNumber },
          select: { id: true },
        });
        if (existing) {
          return {
            normalized: null,
            status: mode === 'create_only' ? 'warning' : 'error',
            errors: mode === 'create_only' ? [] : ['PURCHASE_ALREADY_EXISTS'],
            warnings: mode === 'create_only' ? ['DUPLICATE_WILL_BE_SKIPPED'] : [],
            action: 'skip',
          };
        }
        return {
          normalized: {
            supplier_id: supplier.id,
            bill_number: billNumber,
            purchase_date: this.stringValue(input.purchase_date),
            total: this.decimalString(input.total, 'total'),
            amount_paid: this.optionalDecimalString(input.amount_paid) ?? '0',
            notes: this.stringValue(input.notes),
          },
          status: 'valid',
          errors: [],
          warnings,
          action: 'create',
        };
      }

      if (entityType === 'ledger_openings') {
        const ledger = await this.findLedger(companyId, input);
        if (!ledger) {
          return { normalized: null, status: 'error', errors: ['LEDGER_NOT_FOUND'], warnings, action: 'skip' };
        }
        const balanceSide = this.stringValue(input.balance_side)?.toLowerCase();
        if (!['debit', 'credit'].includes(balanceSide ?? '')) {
          return { normalized: null, status: 'error', errors: ['INVALID_BALANCE_SIDE'], warnings, action: 'skip' };
        }
        return {
          normalized: {
            ledger_id: ledger.id,
            balance_side: balanceSide,
            amount: this.decimalString(input.amount, 'amount'),
            date: this.stringValue(input.date),
            narration: this.stringValue(input.narration) ?? 'Opening balance import',
          },
          status: 'valid',
          errors: [],
          warnings,
          action: 'create',
        };
      }

      return {
        normalized: null,
        status: 'error',
        errors: ['UNSUPPORTED_ENTITY_TYPE'],
        warnings,
        action: 'skip',
      };
    } catch (error) {
      return {
        normalized: null,
        status: 'error',
        errors: [error instanceof Error ? error.message : 'ROW_VALIDATION_FAILED'],
        warnings,
        action: 'skip',
      };
    }
  }

  private async commitCustomerRow(
    companyId: string,
    rowId: string,
    normalized: Record<string, unknown>,
    action: 'create' | 'update' | 'skip',
  ) {
    if (action === 'skip') return null;
    const existing = await this.findCustomer(companyId, normalized);
    const data = {
      externalCode: this.stringValue(normalized.external_code),
      migrationSourceRef: rowId,
      name: String(normalized.name),
      gstin: this.stringValue(normalized.gstin),
      phone: this.stringValue(normalized.phone),
      email: this.stringValue(normalized.email),
      stateCode: this.stringValue(normalized.state_code),
      billingAddress: normalized.billing_address
        ? (normalized.billing_address as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      shippingAddress: normalized.shipping_address
        ? (normalized.shipping_address as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      pricingTier: this.stringValue(normalized.pricing_tier),
      creditLimit: this.stringValue(normalized.credit_limit),
    };
    if (existing) {
      return this.prisma.customer.update({
        where: { id: existing.id },
        data,
      });
    }
    return this.prisma.customer.create({
      data: {
        companyId,
        ...data,
      },
    });
  }

  private async commitSupplierRow(
    companyId: string,
    rowId: string,
    normalized: Record<string, unknown>,
    action: 'create' | 'update' | 'skip',
  ) {
    if (action === 'skip') return null;
    const existing = await this.findSupplier(companyId, normalized);
    const data = {
      externalCode: this.stringValue(normalized.external_code),
      migrationSourceRef: rowId,
      name: String(normalized.name),
      gstin: this.stringValue(normalized.gstin),
      phone: this.stringValue(normalized.phone),
      email: this.stringValue(normalized.email),
      stateCode: this.stringValue(normalized.state_code),
      address: normalized.address
        ? (normalized.address as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    };
    if (existing) {
      return this.prisma.supplier.update({
        where: { id: existing.id },
        data,
      });
    }
    return this.prisma.supplier.create({
      data: {
        companyId,
        ...data,
      },
    });
  }

  private async commitCategoryRow(
    companyId: string,
    normalized: Record<string, unknown>,
    action: 'create' | 'update' | 'skip',
  ) {
    if (action === 'skip') return null;
    const name = String(normalized.name);
    const existing = await this.prisma.category.findFirst({
      where: { companyId, name },
    });
    if (existing) return existing;
    return this.prisma.category.create({
      data: { companyId, name },
    });
  }

  private async resolveCategoryId(companyId: string, categoryName?: string | null) {
    if (!categoryName) return null;
    const existing = await this.prisma.category.findFirst({
      where: { companyId, name: categoryName },
      select: { id: true },
    });
    if (existing) return existing.id;
    const created = await this.prisma.category.create({
      data: { companyId, name: categoryName },
      select: { id: true },
    });
    return created.id;
  }

  private async commitProductRow(
    companyId: string,
    rowId: string,
    normalized: Record<string, unknown>,
    action: 'create' | 'update' | 'skip',
  ) {
    if (action === 'skip') return null;
    const existing = await this.findProduct(companyId, normalized);
    const categoryId = await this.resolveCategoryId(
      companyId,
      this.stringValue(normalized.category_name),
    );
    const data = {
      externalCode: this.stringValue(normalized.external_code),
      migrationSourceRef: rowId,
      name: String(normalized.name),
      sku: this.stringValue(normalized.sku),
      categoryId,
      hsn: this.stringValue(normalized.hsn),
      price: new Decimal(String(normalized.price)),
      costPrice: new Decimal(String(normalized.cost_price ?? '0')),
      taxRate: normalized.tax_rate ? new Decimal(String(normalized.tax_rate)) : null,
      batchTrackingEnabled: Boolean(normalized.batch_tracking_enabled),
      expiryTrackingEnabled: Boolean(normalized.expiry_tracking_enabled),
      batchIssuePolicy: String(normalized.batch_issue_policy ?? 'NONE'),
      nearExpiryDays: Number(normalized.near_expiry_days ?? 0),
    };
    if (existing) {
      return this.prisma.product.update({
        where: { id: existing.id },
        data,
      });
    }
    return this.prisma.product.create({
      data: {
        companyId,
        stock: new Decimal(0),
        ...data,
      },
    });
  }

  private async commitWarehouseRow(
    companyId: string,
    normalized: Record<string, unknown>,
    action: 'create' | 'update' | 'skip',
  ) {
    if (action === 'skip') return null;
    const existing = await this.findWarehouse(companyId, normalized);
    const data = {
      externalCode: this.stringValue(normalized.external_code),
      code: String(normalized.code),
      name: String(normalized.name),
      locationLabel: this.stringValue(normalized.location_label),
      isDefault: Boolean(normalized.is_default),
    };
    if (existing) {
      return this.prisma.warehouse.update({
        where: { id: existing.id },
        data,
      });
    }
    return this.prisma.warehouse.create({
      data: {
        companyId,
        isActive: true,
        ...data,
      },
    });
  }

  private async commitLedgerRow(
    companyId: string,
    rowId: string,
    normalized: Record<string, unknown>,
    action: 'create' | 'update' | 'skip',
  ) {
    if (action === 'skip') return null;
    const existing = await this.findLedger(companyId, normalized);
    const data = {
      externalCode: this.stringValue(normalized.external_code),
      migrationSourceRef: rowId,
      accountCode: String(normalized.account_code),
      accountName: String(normalized.account_name),
      type: String(normalized.type),
    };
    if (existing) {
      return this.prisma.ledger.update({
        where: { id: existing.id },
        data,
      });
    }
    return this.prisma.ledger.create({
      data: { companyId, ...data },
    });
  }

  private async commitOpeningStockRow(
    companyId: string,
    rowId: string,
    normalized: Record<string, unknown>,
  ) {
    const productId = String(normalized.product_id);
    const warehouseId = String(normalized.warehouse_id);
    const quantity = new Decimal(String(normalized.quantity));

    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId },
      select: {
        id: true,
        batchTrackingEnabled: true,
        expiryTrackingEnabled: true,
      },
    });
    if (!product) throw new NotFoundException('Product not found');

    await this.prisma.$transaction(async (tx) => {
      await this.inventory.adjustStock({
        tx,
        companyId,
        productId,
        delta: quantity,
        sourceType: 'opening',
        sourceId: rowId,
        warehouseId,
        note: 'Imported opening stock',
        overrideAllowNegative: true,
      });

      if (product.batchTrackingEnabled && this.stringValue(normalized.batch_number)) {
        const productBatch = await tx.productBatch.upsert({
          where: {
            companyId_productId_batchNumber: {
              companyId,
              productId,
              batchNumber: String(normalized.batch_number),
            },
          },
          create: {
            companyId,
            productId,
            batchNumber: String(normalized.batch_number),
            expiryDate: this.optionalDateOnly(normalized.expiry_date),
            manufacturingDate: this.optionalDateOnly(normalized.manufacturing_date),
          },
          update: {
            expiryDate: this.optionalDateOnly(normalized.expiry_date) ?? undefined,
            manufacturingDate:
              this.optionalDateOnly(normalized.manufacturing_date) ?? undefined,
            updatedAt: new Date(),
          },
        });

        const current = await tx.warehouseBatchStock.findUnique({
          where: {
            warehouseId_productBatchId: {
              warehouseId,
              productBatchId: productBatch.id,
            },
          },
        });

        await tx.warehouseBatchStock.upsert({
          where: {
            warehouseId_productBatchId: {
              warehouseId,
              productBatchId: productBatch.id,
            },
          },
          create: {
            companyId,
            warehouseId,
            productBatchId: productBatch.id,
            quantity,
            reservedQuantity: new Decimal(0),
          },
          update: {
            quantity: new Decimal(current?.quantity ?? 0).add(quantity),
            updatedAt: new Date(),
          },
        });
      }
    });

    return { id: productId };
  }

  private async createImportedInvoice(
    companyId: string,
    rowId: string,
    normalized: Record<string, unknown>,
  ): Promise<Invoice> {
    const total = new Decimal(String(normalized.total));
    const amountPaid = new Decimal(String(normalized.amount_paid ?? '0'));
    const balanceDue = total.sub(amountPaid);
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          companyId,
          customerId: String(normalized.customer_id),
          invoiceNumber: String(normalized.invoice_number),
          status: balanceDue.lte(0) ? 'paid' : 'issued',
          issueDate: this.optionalDateOnly(normalized.issue_date),
          dueDate: this.optionalDateOnly(normalized.due_date),
          notes: this.stringValue(normalized.notes),
          subTotal: total,
          taxTotal: new Decimal(0),
          total,
          amountPaid,
          balanceDue,
          migrationSourceRef: rowId,
        },
      });

      if (amountPaid.gt(0)) {
        await tx.payment.create({
          data: {
            companyId,
            invoiceId: invoice.id,
            amount: amountPaid,
            method: 'import_opening',
            instrumentStatus: 'cleared',
            notes: 'Imported opening receipt',
          },
        });
      }

      return invoice;
    });
  }

  private async createImportedPurchase(
    companyId: string,
    rowId: string,
    normalized: Record<string, unknown>,
  ): Promise<Purchase> {
    const total = new Decimal(String(normalized.total));
    const amountPaid = new Decimal(String(normalized.amount_paid ?? '0'));
    return this.prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          companyId,
          supplierId: String(normalized.supplier_id),
          status: 'received',
          purchaseDate: this.optionalDateOnly(normalized.purchase_date) ?? new Date(),
          notes: this.stringValue(normalized.notes),
          subTotal: total,
          taxTotal: new Decimal(0),
          total,
          receivedAt: new Date(),
          migrationSourceRef: String(normalized.bill_number ?? rowId),
        },
      });

      if (amountPaid.gt(0)) {
        await tx.payment.create({
          data: {
            companyId,
            purchaseId: purchase.id,
            amount: amountPaid,
            method: 'import_opening',
            instrumentStatus: 'cleared',
            notes: 'Imported opening supplier payment',
          },
        });
      }

      return purchase;
    });
  }

  private async commitLedgerOpeningRow(
    companyId: string,
    rowId: string,
    normalized: Record<string, unknown>,
  ) {
    const openingLedger = await this.prisma.ledger.findFirst({
      where: { companyId, accountCode: '3000' },
      select: { id: true },
    });
    if (!openingLedger) {
      throw new BadRequestException('Owner Capital ledger (3000) is required');
    }

    const isDebit = String(normalized.balance_side) === 'debit';
    await this.accounting.createJournal(companyId, {
      date: this.optionalDateOnly(normalized.date)?.toISOString().slice(0, 10) ??
        new Date().toISOString().slice(0, 10),
      narration: `${String(normalized.narration ?? 'Opening balance import')} [${rowId}]`,
      lines: [
        {
          debit_ledger_id: isDebit ? String(normalized.ledger_id) : undefined,
          credit_ledger_id: isDebit ? undefined : String(normalized.ledger_id),
          amount: String(normalized.amount),
        },
        {
          debit_ledger_id: isDebit ? undefined : openingLedger.id,
          credit_ledger_id: isDebit ? openingLedger.id : undefined,
          amount: String(normalized.amount),
        },
      ],
    });
    return { id: String(normalized.ledger_id) };
  }

  private async commitImportRow(
    companyId: string,
    entityType: string,
    rowId: string,
    normalized: Record<string, unknown>,
    action: 'create' | 'update' | 'skip',
  ) {
    if (entityType === 'customers') {
      return this.commitCustomerRow(companyId, rowId, normalized, action);
    }
    if (entityType === 'suppliers') {
      return this.commitSupplierRow(companyId, rowId, normalized, action);
    }
    if (entityType === 'categories') {
      return this.commitCategoryRow(companyId, normalized, action);
    }
    if (entityType === 'products') {
      return this.commitProductRow(companyId, rowId, normalized, action);
    }
    if (entityType === 'warehouses') {
      return this.commitWarehouseRow(companyId, normalized, action);
    }
    if (entityType === 'ledgers') {
      return this.commitLedgerRow(companyId, rowId, normalized, action);
    }
    if (entityType === 'opening_stock') {
      return this.commitOpeningStockRow(companyId, rowId, normalized);
    }
    if (['customer_opening_outstanding', 'open_sales_invoices'].includes(entityType)) {
      return this.createImportedInvoice(companyId, rowId, normalized);
    }
    if (['supplier_opening_outstanding', 'open_purchase_bills'].includes(entityType)) {
      return this.createImportedPurchase(companyId, rowId, normalized);
    }
    if (entityType === 'ledger_openings') {
      return this.commitLedgerOpeningRow(companyId, rowId, normalized);
    }
    throw new BadRequestException(`Unsupported import entity type: ${entityType}`);
  }

  async listMigrationProjects(companyId: string) {
    return {
      data: await this.prisma.migrationProject.findMany({
        where: { companyId },
        orderBy: [{ createdAt: 'desc' }],
        include: {
          _count: { select: { jobs: true } },
        },
      }),
    };
  }

  async createMigrationProject(
    companyId: string,
    dto: CreateMigrationProjectDto,
    userId?: string | null,
  ) {
    return {
      data: await this.prisma.migrationProject.create({
        data: {
          companyId,
          name: dto.name.trim(),
          sourceSystem: dto.source_system?.trim() || null,
          goLiveDate: dto.go_live_date ? new Date(dto.go_live_date) : null,
          notes: dto.notes?.trim() || null,
          checklist: {
            masters: false,
            opening_stock: false,
            opening_balances: false,
            open_documents: false,
            print_templates: false,
            webhooks: false,
          },
          createdByUserId: userId ?? null,
        },
      }),
    };
  }

  async getMigrationProject(companyId: string, projectId: string) {
    await this.ensureProject(companyId, projectId);
    return {
      data: await this.prisma.migrationProject.findFirst({
        where: { id: projectId, companyId },
        include: {
          jobs: {
            orderBy: [{ createdAt: 'desc' }],
            select: {
              id: true,
              entityType: true,
              status: true,
              createdAt: true,
              summary: true,
            },
          },
        },
      }),
    };
  }

  async updateMigrationProject(
    companyId: string,
    projectId: string,
    dto: UpdateMigrationProjectDto,
  ) {
    await this.ensureProject(companyId, projectId);
    return {
      data: await this.prisma.migrationProject.update({
        where: { id: projectId },
        data: {
          name: dto.name?.trim(),
          sourceSystem:
            dto.source_system !== undefined ? dto.source_system?.trim() || null : undefined,
          goLiveDate:
            dto.go_live_date !== undefined
              ? dto.go_live_date
                ? new Date(dto.go_live_date)
                : null
              : undefined,
          status: dto.status?.trim(),
          notes: dto.notes !== undefined ? dto.notes?.trim() || null : undefined,
        },
      }),
    };
  }

  async listImportTemplates() {
    return {
      data: TEMPLATE_DEFINITIONS.map((template) => ({
        entity_type: template.entityType,
        title: template.title,
        columns: template.columns,
        sample: template.sample,
      })),
    };
  }

  async getImportTemplateDownload(entityType: string) {
    const template = this.templateFor(entityType);
    return {
      data: {
        filename: `${entityType}.csv`,
        content: this.buildCsv(template),
        columns: template.columns,
      },
    };
  }

  async listImportProfiles(companyId: string) {
    return {
      data: await this.prisma.importProfile.findMany({
        where: { companyId },
        orderBy: [{ createdAt: 'desc' }],
      }),
    };
  }

  async createImportProfile(
    companyId: string,
    dto: CreateImportProfileDto,
    userId?: string | null,
  ) {
    this.templateFor(dto.entity_type);
    return {
      data: await this.prisma.importProfile.create({
        data: {
          companyId,
          name: dto.name.trim(),
          entityType: dto.entity_type,
          sourceFormat: dto.source_format,
          columnMappings: dto.column_mappings as Prisma.InputJsonValue,
          options: dto.options
            ? (dto.options as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          createdByUserId: userId ?? null,
        },
      }),
    };
  }

  async updateImportProfile(
    companyId: string,
    profileId: string,
    dto: UpdateImportProfileDto,
  ) {
    await this.ensureProfile(companyId, profileId);
    return {
      data: await this.prisma.importProfile.update({
        where: { id: profileId },
        data: {
          name: dto.name?.trim(),
          entityType: dto.entity_type,
          sourceFormat: dto.source_format,
          columnMappings:
            dto.column_mappings !== undefined
              ? (dto.column_mappings as Prisma.InputJsonValue)
              : undefined,
          options:
            dto.options !== undefined
              ? dto.options
                ? (dto.options as Prisma.InputJsonValue)
                : Prisma.JsonNull
              : undefined,
        },
      }),
    };
  }

  async uploadImportJob(
    companyId: string,
    dto: UploadImportJobDto,
    userId?: string | null,
  ) {
    const template = this.templateFor(dto.entity_type);
    const profile = await this.ensureProfile(companyId, dto.import_profile_id);
    await this.ensureProject(companyId, dto.migration_project_id);
    const parsed = this.parseWorkbook({
      fileName: dto.file_name,
      sourceFormat: dto.source_format,
      contentBase64: dto.file_content_base64,
      contentText: dto.file_content_text,
    });

    const job = await this.prisma.importJob.create({
      data: {
        companyId,
        migrationProjectId: dto.migration_project_id ?? null,
        importProfileId: dto.import_profile_id ?? null,
        entityType: dto.entity_type,
        sourceFormat: parsed.sourceFormat,
        mode: dto.mode?.trim() || 'create_only',
        fileName: dto.file_name?.trim() || null,
        sourceDigest: parsed.sourceDigest,
        createdByUserId: userId ?? null,
      },
    });

    const mappings: Record<string, string> = {
      ...((profile?.columnMappings as Record<string, string> | null) ?? {}),
      ...(dto.column_mapping ?? {}),
    };

    await this.prisma.importJobRow.createMany({
      data: parsed.rows.map((rawRow, index) => ({
        companyId,
        importJobId: job.id,
        rowNumber: index + 1,
        rawPayloadJson: this.normalizeWorkbookRow(rawRow, template, mappings) as Prisma.InputJsonValue,
      })),
    });

    return this.getImportJob(companyId, job.id);
  }

  async dryRunImportJob(companyId: string, jobId: string) {
    const job = await this.ensureImportJob(companyId, jobId);
    const rows = await this.prisma.importJobRow.findMany({
      where: { companyId, importJobId: jobId },
      orderBy: { rowNumber: 'asc' },
    });

    for (const row of rows) {
      const rawPayload = row.rawPayloadJson as Record<string, unknown>;
      const result = await this.normalizeImportRow(
        companyId,
        job.entityType,
        rawPayload,
        job.mode,
      );
      await this.prisma.importJobRow.update({
        where: { id: row.id },
        data: {
          normalizedPayloadJson: result.normalized
            ? (result.normalized as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          status: result.status,
          warningCodesJson: result.warnings as Prisma.InputJsonValue,
          errorCodesJson: result.errors as Prisma.InputJsonValue,
        },
      });
    }

    const refreshedRows = await this.prisma.importJobRow.findMany({
      where: { importJobId: jobId },
      select: {
        status: true,
        warningCodesJson: true,
        errorCodesJson: true,
      },
    });
    const aggregated = this.summarizeRows(
      refreshedRows.map((row) => ({
        status: row.status,
        warningCodes: row.warningCodesJson,
        errorCodes: row.errorCodesJson,
      })),
    );
    await this.prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'dry_run_ready',
        summary: aggregated as Prisma.InputJsonValue,
      },
    });

    return this.getImportJob(companyId, jobId);
  }

  async commitImportJob(companyId: string, jobId: string) {
    const job = await this.ensureImportJob(companyId, jobId);
    if (job.status === 'uploaded') {
      await this.dryRunImportJob(companyId, jobId);
    }

    const rows = await this.prisma.importJobRow.findMany({
      where: {
        companyId,
        importJobId: jobId,
        status: { in: ['valid', 'warning'] },
      },
      orderBy: { rowNumber: 'asc' },
    });

    for (const row of rows) {
      const normalized = row.normalizedPayloadJson as Record<string, unknown> | null;
      const warnings = Array.isArray(row.warningCodesJson)
        ? row.warningCodesJson.map(String)
        : [];
      if (warnings.includes('DUPLICATE_WILL_BE_SKIPPED')) {
        await this.prisma.importJobRow.update({
          where: { id: row.id },
          data: { status: 'skipped' },
        });
        continue;
      }
      if (!normalized) {
        await this.prisma.importJobRow.update({
          where: { id: row.id },
          data: {
            status: 'error',
            errorCodesJson: ['NORMALIZED_PAYLOAD_MISSING'] as Prisma.InputJsonValue,
          },
        });
        continue;
      }

      try {
        const validation = await this.normalizeImportRow(
          companyId,
          job.entityType,
          row.rawPayloadJson as Record<string, unknown>,
          job.mode,
        );
        const result = await this.commitImportRow(
          companyId,
          job.entityType,
          row.id,
          normalized,
          validation.action,
        );

        await this.prisma.importJobRow.update({
          where: { id: row.id },
          data: {
            status: validation.action === 'skip' ? 'skipped' : 'committed',
            resultEntityType: job.entityType,
            resultEntityId:
              result && typeof result === 'object' && 'id' in result
                ? String((result as { id: string }).id)
                : null,
          },
        });
      } catch (error) {
        await this.prisma.importJobRow.update({
          where: { id: row.id },
          data: {
            status: 'error',
            errorCodesJson: [
              error instanceof Error ? error.message : 'COMMIT_FAILED',
            ] as Prisma.InputJsonValue,
          },
        });
      }
    }

    const refreshedRows = await this.prisma.importJobRow.findMany({
      where: { importJobId: jobId },
      select: {
        status: true,
        warningCodesJson: true,
        errorCodesJson: true,
      },
    });
    const aggregated = this.summarizeRows(
      refreshedRows.map((row) => ({
        status: row.status,
        warningCodes: row.warningCodesJson,
        errorCodes: row.errorCodesJson,
      })),
    );

    await this.prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'committed',
        committedAt: new Date(),
        summary: aggregated as Prisma.InputJsonValue,
      },
    });

    await this.publishWebhookEvent(companyId, 'import.job.committed', `import-job:${jobId}`, {
      job_id: jobId,
      entity_type: job.entityType,
      summary: aggregated.summary,
    });

    return this.getImportJob(companyId, jobId);
  }

  async listImportJobs(companyId: string) {
    return {
      data: await this.prisma.importJob.findMany({
        where: { companyId },
        orderBy: [{ createdAt: 'desc' }],
        include: {
          migrationProject: { select: { id: true, name: true } },
        },
      }),
    };
  }

  async getImportJob(companyId: string, jobId: string) {
    const job = await this.ensureImportJob(companyId, jobId);
    const summary = (job.summary as Record<string, unknown> | null) ?? null;
    return {
      data: {
        ...job,
        entity_type: job.entityType,
        source_format: job.sourceFormat,
        migration_project_id: job.migrationProjectId,
        import_profile_id: job.importProfileId,
        file_name: job.fileName,
        summary: summary?.summary ?? summary,
        top_errors: summary?.top_errors ?? [],
      },
    };
  }

  async listImportJobRows(args: {
    companyId: string;
    jobId: string;
    page: number;
    limit: number;
    status?: string;
  }) {
    await this.ensureImportJob(args.companyId, args.jobId);
    const where: Prisma.ImportJobRowWhereInput = {
      companyId: args.companyId,
      importJobId: args.jobId,
      ...(args.status ? { status: args.status } : {}),
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.importJobRow.count({ where }),
      this.prisma.importJobRow.findMany({
        where,
        skip: (args.page - 1) * args.limit,
        take: args.limit,
        orderBy: { rowNumber: 'asc' },
      }),
    ]);
    return {
      data: rows,
      meta: { total, page: args.page, limit: args.limit },
    };
  }

  async createPrintTemplate(
    companyId: string,
    dto: CreatePrintTemplateDto,
    userId?: string | null,
  ) {
    if (!PRINT_TEMPLATE_TYPES.has(dto.template_type)) {
      throw new BadRequestException('Unsupported print template type');
    }
    const template = await this.prisma.printTemplate.create({
      data: {
        companyId,
        templateType: dto.template_type,
        name: dto.name.trim(),
        createdByUserId: userId ?? null,
      },
    });
    const version = await this.prisma.printTemplateVersion.create({
      data: {
        companyId,
        printTemplateId: template.id,
        versionNo: 1,
        schemaVersion: '1',
        layoutJson: (dto.layout ?? {
          header: { show_logo: true, title: dto.template_type.toUpperCase() },
          sections: [
            { key: 'party', label: 'Party details' },
            { key: 'items', label: 'Line items' },
            { key: 'totals', label: 'Totals' },
            { key: 'footer', label: 'Footer notes' },
          ],
        }) as Prisma.InputJsonValue,
        createdByUserId: userId ?? null,
      },
    });
    await this.prisma.printTemplate.update({
      where: { id: template.id },
      data: { publishedVersionId: version.id },
    });
    return this.getPrintTemplate(companyId, template.id);
  }

  async listPrintTemplates(companyId: string, templateType?: string) {
    return {
      data: await this.prisma.printTemplate.findMany({
        where: {
          companyId,
          ...(templateType ? { templateType } : {}),
        },
        orderBy: [{ templateType: 'asc' }, { createdAt: 'desc' }],
        include: {
          versions: {
            orderBy: { versionNo: 'desc' },
            take: 1,
          },
        },
      }),
    };
  }

  async getPrintTemplate(companyId: string, templateId: string) {
    const template = await this.ensurePrintTemplate(companyId, templateId);
    return { data: template };
  }

  async createPrintTemplateVersion(
    companyId: string,
    templateId: string,
    dto: CreatePrintTemplateVersionDto,
    userId?: string | null,
  ) {
    const template = await this.ensurePrintTemplate(companyId, templateId);
    const nextVersion = (template.versions[0]?.versionNo ?? 0) + 1;
    return {
      data: await this.prisma.printTemplateVersion.create({
        data: {
          companyId,
          printTemplateId: templateId,
          versionNo: nextVersion,
          schemaVersion: '1',
          layoutJson: dto.layout as Prisma.InputJsonValue,
          sampleOptionsJson: dto.sample_options
            ? (dto.sample_options as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          createdByUserId: userId ?? null,
        },
      }),
    };
  }

  async publishPrintTemplate(companyId: string, templateId: string) {
    const template = await this.ensurePrintTemplate(companyId, templateId);
    const latestVersion = template.versions[0];
    if (!latestVersion) {
      throw new BadRequestException('Template has no versions to publish');
    }
    return {
      data: await this.prisma.printTemplate.update({
        where: { id: templateId },
        data: {
          status: 'published',
          publishedVersionId: latestVersion.id,
        },
      }),
    };
  }

  async setDefaultPrintTemplate(companyId: string, templateId: string) {
    const template = await this.ensurePrintTemplate(companyId, templateId);
    await this.prisma.printTemplate.updateMany({
      where: { companyId, templateType: template.templateType },
      data: { isDefault: false },
    });
    return {
      data: await this.prisma.printTemplate.update({
        where: { id: templateId },
        data: { isDefault: true },
      }),
    };
  }

  async previewPrintTemplate(
    companyId: string,
    templateId: string,
    dto: PreviewPrintTemplateDto,
  ) {
    const template = await this.ensurePrintTemplate(companyId, templateId);
    const version =
      template.versions.find((item) => item.id === template.publishedVersionId) ??
      template.versions[0];
    if (!version) {
      throw new BadRequestException('Template has no versions');
    }
    const sampleData = await this.resolvePrintPreviewData({
      companyId,
      templateType: template.templateType,
      documentType: dto.document_type,
      documentId: dto.document_id,
    });

    return {
      data: {
        template,
        version,
        preview: sampleData,
      },
    };
  }

  async listCustomFields(companyId: string, entityType?: string) {
    return {
      data: await this.prisma.customFieldDefinition.findMany({
        where: {
          companyId,
          ...(entityType ? { entityType } : {}),
        },
        orderBy: [{ entityType: 'asc' }, { label: 'asc' }],
      }),
    };
  }

  async createCustomField(
    companyId: string,
    dto: CreateCustomFieldDto,
    userId?: string | null,
  ) {
    if (!CUSTOM_FIELD_ENTITY_TYPES.has(dto.entity_type)) {
      throw new BadRequestException('Unsupported custom field entity type');
    }
    return {
      data: await this.prisma.customFieldDefinition.create({
        data: {
          companyId,
          entityType: dto.entity_type,
          code: dto.code.trim(),
          label: dto.label.trim(),
          fieldType: dto.field_type.trim(),
          isRequired: dto.is_required ?? false,
          isActive: dto.is_active ?? true,
          isSearchable: dto.is_searchable ?? false,
          isPrintable: dto.is_printable ?? false,
          isExportable: dto.is_exportable ?? false,
          defaultValueJson:
            dto.default_value !== undefined
              ? (dto.default_value as Prisma.InputJsonValue)
              : Prisma.JsonNull,
          validationJson: dto.validation
            ? (dto.validation as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          optionsJson: dto.options
            ? (dto.options as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          createdByUserId: userId ?? null,
        },
      }),
    };
  }

  async updateCustomField(
    companyId: string,
    fieldId: string,
    dto: UpdateCustomFieldDto,
  ) {
    await this.ensureCustomFieldDefinition(companyId, fieldId);
    return {
      data: await this.prisma.customFieldDefinition.update({
        where: { id: fieldId },
        data: {
          label: dto.label?.trim(),
          fieldType: dto.field_type?.trim(),
          isRequired: dto.is_required,
          isActive: dto.is_active,
          isSearchable: dto.is_searchable,
          isPrintable: dto.is_printable,
          isExportable: dto.is_exportable,
          defaultValueJson:
            dto.default_value !== undefined
              ? (dto.default_value as Prisma.InputJsonValue)
              : undefined,
          validationJson:
            dto.validation !== undefined
              ? dto.validation
                ? (dto.validation as Prisma.InputJsonValue)
                : Prisma.JsonNull
              : undefined,
          optionsJson:
            dto.options !== undefined
              ? dto.options
                ? (dto.options as Prisma.InputJsonValue)
                : Prisma.JsonNull
              : undefined,
        },
      }),
    };
  }

  private async assertCustomFieldEntity(
    companyId: string,
    entityType: string,
    entityId: string,
  ) {
    if (entityType === 'customer') {
      const item = await this.prisma.customer.findFirst({
        where: { id: entityId, companyId, deletedAt: null },
        select: { id: true },
      });
      if (!item) throw new NotFoundException('Customer not found');
      return;
    }
    if (entityType === 'supplier') {
      const item = await this.prisma.supplier.findFirst({
        where: { id: entityId, companyId, deletedAt: null },
        select: { id: true },
      });
      if (!item) throw new NotFoundException('Supplier not found');
      return;
    }
    if (entityType === 'product') {
      const item = await this.prisma.product.findFirst({
        where: { id: entityId, companyId, deletedAt: null },
        select: { id: true },
      });
      if (!item) throw new NotFoundException('Product not found');
      return;
    }
    if (entityType === 'invoice') {
      const item = await this.prisma.invoice.findFirst({
        where: { id: entityId, companyId },
        select: { id: true },
      });
      if (!item) throw new NotFoundException('Invoice not found');
      return;
    }
    if (entityType === 'sales_order') {
      const item = await this.prisma.salesOrder.findFirst({
        where: { id: entityId, companyId },
        select: { id: true },
      });
      if (!item) throw new NotFoundException('Sales order not found');
      return;
    }
    if (entityType === 'purchase') {
      const item = await this.prisma.purchase.findFirst({
        where: { id: entityId, companyId },
        select: { id: true },
      });
      if (!item) throw new NotFoundException('Purchase not found');
      return;
    }
    throw new BadRequestException('Unsupported custom field entity type');
  }

  async listCustomFieldValues(
    companyId: string,
    entityType: string,
    entityId: string,
  ) {
    return {
      data: await this.prisma.customFieldValue.findMany({
        where: { companyId, entityType, entityId },
        include: {
          definition: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    };
  }

  async setCustomFieldValue(companyId: string, dto: SetCustomFieldValueDto) {
    const definition = await this.ensureCustomFieldDefinition(
      companyId,
      dto.definition_id,
    );
    if (definition.entityType !== dto.entity_type) {
      throw new BadRequestException('Custom field entity type mismatch');
    }
    await this.assertCustomFieldEntity(companyId, dto.entity_type, dto.entity_id);
    return {
      data: await this.prisma.customFieldValue.upsert({
        where: {
          definitionId_entityId: {
            definitionId: dto.definition_id,
            entityId: dto.entity_id,
          },
        },
        create: {
          companyId,
          definitionId: dto.definition_id,
          entityType: dto.entity_type,
          entityId: dto.entity_id,
          valueJson: dto.value as Prisma.InputJsonValue,
        },
        update: {
          valueJson: dto.value as Prisma.InputJsonValue,
          updatedAt: new Date(),
        },
      }),
    };
  }

  async listWebhookEndpoints(companyId: string) {
    const endpoints = await this.prisma.outboundWebhookEndpoint.findMany({
      where: { companyId },
      orderBy: [{ createdAt: 'desc' }],
    });
    return {
      data: endpoints.map((endpoint) => this.serializeWebhookEndpoint(endpoint)),
    };
  }

  async listSupportedWebhookEvents() {
    return {
      data: SUPPORTED_WEBHOOK_EVENTS,
    };
  }

  async createWebhookEndpoint(
    companyId: string,
    dto: CreateWebhookEndpointDto,
    userId?: string | null,
  ) {
    const subscribedEvents = this.ensureSubscribedWebhookEvents(
      dto.subscribed_events ?? ['integration.test', 'import.job.committed'],
    );
    const endpoint = await this.prisma.outboundWebhookEndpoint.create({
      data: {
        companyId,
        name: dto.name.trim(),
        url: dto.url.trim(),
        // Stored value is the shared signing secret; response never exposes it.
        secretHash: dto.secret.trim(),
        subscribedEvents: subscribedEvents as Prisma.InputJsonValue,
        createdByUserId: userId ?? null,
      },
    });
    return {
      data: this.serializeWebhookEndpoint(endpoint),
    };
  }

  async updateWebhookEndpoint(
    companyId: string,
    endpointId: string,
    dto: UpdateWebhookEndpointDto,
  ) {
    await this.ensureWebhookEndpoint(companyId, endpointId);
    const subscribedEvents =
      dto.subscribed_events !== undefined
        ? this.ensureSubscribedWebhookEvents(dto.subscribed_events)
        : undefined;
    const endpoint = await this.prisma.outboundWebhookEndpoint.update({
      where: { id: endpointId },
      data: {
        name: dto.name?.trim(),
        url: dto.url?.trim(),
        secretHash: dto.secret ? dto.secret.trim() : undefined,
        subscribedEvents:
          subscribedEvents !== undefined
            ? (subscribedEvents as Prisma.InputJsonValue)
            : undefined,
        status: dto.status?.trim(),
      },
    });
    return {
      data: this.serializeWebhookEndpoint(endpoint),
    };
  }

  private async recordWebhookDelivery(args: {
    companyId: string;
    endpointId: string;
    eventType: string;
    eventKey: string;
    requestHeaders: Record<string, string>;
    requestBody: Record<string, unknown>;
    responseStatus?: number;
    responseBodyExcerpt?: string | null;
    status: 'pending' | 'delivered' | 'retrying' | 'failed';
    attemptCount?: number;
    nextRetryAt?: Date | null;
  }) {
    return this.prisma.outboundWebhookDelivery.create({
      data: {
        companyId: args.companyId,
        endpointId: args.endpointId,
        eventType: args.eventType,
        eventKey: args.eventKey,
        requestHeadersJson: args.requestHeaders as Prisma.InputJsonValue,
        requestBodyJson: args.requestBody as Prisma.InputJsonValue,
        responseStatus: args.responseStatus ?? null,
        responseBodyExcerpt: args.responseBodyExcerpt ?? null,
        status: args.status,
        attemptCount: args.attemptCount ?? 1,
        nextRetryAt: args.nextRetryAt ?? null,
      },
    });
  }

  private async attemptWebhookDelivery(args: {
    endpoint: {
      id: string;
      url: string;
      secretHash: string;
    };
    companyId: string;
    eventType: string;
    eventKey: string;
    body: Record<string, unknown>;
    attemptCount: number;
    deliveryId?: string;
    allowRetry?: boolean;
  }) {
    const requestBody = JSON.stringify(args.body);
    const headers = {
      'content-type': 'application/json',
      'x-gst-billing-event': args.eventType,
      'x-gst-billing-signature': this.signWebhook(args.endpoint.secretHash, requestBody),
    };

    const delivery =
      args.deliveryId
        ? await this.prisma.outboundWebhookDelivery.update({
            where: { id: args.deliveryId },
            data: {
              requestHeadersJson: headers as Prisma.InputJsonValue,
              requestBodyJson: args.body as Prisma.InputJsonValue,
              responseStatus: null,
              responseBodyExcerpt: null,
              status: 'pending',
              attemptCount: args.attemptCount,
              nextRetryAt: null,
            },
          })
        : await this.recordWebhookDelivery({
            companyId: args.companyId,
            endpointId: args.endpoint.id,
            eventType: args.eventType,
            eventKey: args.eventKey,
            requestHeaders: headers,
            requestBody: args.body,
            status: 'pending',
            attemptCount: args.attemptCount,
          });

    try {
      const response = await fetch(args.endpoint.url, {
        method: 'POST',
        headers,
        body: requestBody,
      });
      const responseBody = await response.text();
      const nextRetryAt = response.ok
        ? null
        : this.nextWebhookRetryAt(args.attemptCount, args.allowRetry !== false);
      const status = response.ok
        ? 'delivered'
        : nextRetryAt
          ? 'retrying'
          : 'failed';

      const updated = await this.prisma.outboundWebhookDelivery.update({
        where: { id: delivery.id },
        data: {
          responseStatus: response.status,
          responseBodyExcerpt: responseBody.slice(0, 500),
          status,
          nextRetryAt,
        },
      });

      await this.prisma.outboundWebhookEndpoint.update({
        where: { id: args.endpoint.id },
        data: response.ok
          ? {
              lastSuccessAt: new Date(),
            }
          : {
              lastFailureAt: new Date(),
            },
      });

      return {
        delivery: updated,
        ok: response.ok,
        responseStatus: response.status,
        responseBodyExcerpt: responseBody.slice(0, 500),
      };
    } catch (error) {
      const nextRetryAt = this.nextWebhookRetryAt(
        args.attemptCount,
        args.allowRetry !== false,
      );
      const updated = await this.prisma.outboundWebhookDelivery.update({
        where: { id: delivery.id },
        data: {
          responseStatus: null,
          responseBodyExcerpt:
            error instanceof Error ? error.message.slice(0, 500) : 'Request failed',
          status: nextRetryAt ? 'retrying' : 'failed',
          nextRetryAt,
        },
      });

      await this.prisma.outboundWebhookEndpoint.update({
        where: { id: args.endpoint.id },
        data: { lastFailureAt: new Date() },
      });

      return {
        delivery: updated,
        ok: false,
        responseStatus: null,
        responseBodyExcerpt:
          error instanceof Error ? error.message : 'Request failed',
      };
    }
  }

  async publishWebhookEvent(
    companyId: string,
    eventType: string,
    eventKey: string,
    payload: Record<string, unknown>,
  ) {
    const endpoints = await this.prisma.outboundWebhookEndpoint.findMany({
      where: {
        companyId,
        status: 'active',
      },
    });

    for (const endpoint of endpoints) {
      const subscribed = Array.isArray(endpoint.subscribedEvents)
        ? endpoint.subscribedEvents.map(String)
        : [];
      if (!subscribed.includes(eventType)) continue;

      const body = {
        event_type: eventType,
        event_key: eventKey,
        company_id: companyId,
        occurred_at: new Date().toISOString(),
        payload,
      };
      await this.attemptWebhookDelivery({
        endpoint,
        companyId,
        eventType,
        eventKey,
        body,
        attemptCount: 1,
        allowRetry: true,
      });
    }
  }

  async testWebhookEndpoint(
    companyId: string,
    endpointId: string,
    dto: TestWebhookEndpointDto,
  ) {
    const endpoint = await this.ensureWebhookEndpoint(companyId, endpointId);
    const eventType = dto.event_type?.trim() || 'integration.test';
    this.ensureSubscribedWebhookEvents([eventType]);
    const payload = {
      endpoint_id: endpoint.id,
      test: true,
      sent_at: new Date().toISOString(),
    };
    const body = {
      event_type: eventType,
      event_key: `test:${endpoint.id}:${Date.now()}`,
      company_id: companyId,
      occurred_at: new Date().toISOString(),
      payload,
    };
    const result = await this.attemptWebhookDelivery({
      endpoint,
      companyId,
      eventType,
      eventKey: body.event_key,
      body,
      attemptCount: 1,
      allowRetry: false,
    });
    return {
      data: {
        delivery: result.delivery,
        ok: result.ok,
        response_status: result.responseStatus,
        response_body_excerpt: result.responseBodyExcerpt,
      },
    };
  }

  async listWebhookDeliveries(companyId: string, endpointId: string) {
    await this.ensureWebhookEndpoint(companyId, endpointId);
    return {
      data: await this.prisma.outboundWebhookDelivery.findMany({
        where: { companyId, endpointId },
        orderBy: [{ createdAt: 'desc' }],
        take: 100,
      }),
    };
  }

  async retryWebhookDelivery(
    companyId: string,
    endpointId: string,
    deliveryId: string,
  ) {
    const endpoint = await this.ensureWebhookEndpoint(companyId, endpointId);
    const delivery = await this.ensureWebhookDelivery(companyId, endpointId, deliveryId);
    if (delivery.status === 'delivered') {
      throw new BadRequestException('Delivered webhook does not need retry');
    }

    const body = delivery.requestBodyJson as Record<string, unknown>;
    const result = await this.attemptWebhookDelivery({
      endpoint,
      companyId,
      eventType: delivery.eventType,
      eventKey: delivery.eventKey,
      body,
      attemptCount: delivery.attemptCount + 1,
      deliveryId: delivery.id,
      allowRetry: true,
    });

    return {
      data: {
        delivery: result.delivery,
        ok: result.ok,
        response_status: result.responseStatus,
        response_body_excerpt: result.responseBodyExcerpt,
      },
    };
  }

  async listIntegrationApiKeys(companyId: string) {
    const keys = await this.prisma.integrationApiKey.findMany({
      where: { companyId },
      orderBy: [{ createdAt: 'desc' }],
    });
    return {
      data: keys.map((record) => this.serializeApiKey(record)),
    };
  }

  async createIntegrationApiKey(
    companyId: string,
    dto: CreateIntegrationApiKeyDto,
    userId?: string | null,
  ) {
    const raw = `gbs_${randomBytes(18).toString('hex')}`;
    const prefix = raw.slice(0, 10);
    const record = await this.prisma.integrationApiKey.create({
      data: {
        companyId,
        name: dto.name.trim(),
        keyPrefix: prefix,
        secretHash: this.sha256(raw),
        createdByUserId: userId ?? null,
      },
    });
    return {
      data: {
        ...this.serializeApiKey(record),
        secret: raw,
      },
    };
  }

  async revokeIntegrationApiKey(companyId: string, keyId: string) {
    const record = await this.prisma.integrationApiKey.findFirst({
      where: { id: keyId, companyId },
    });
    if (!record) throw new NotFoundException('Integration API key not found');
    const updated = await this.prisma.integrationApiKey.update({
      where: { id: keyId },
      data: { status: 'revoked' },
    });
    return {
      data: this.serializeApiKey(updated),
    };
  }
}
