import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { GenerateEWayBillDto } from './dto/generate-eway-bill.dto';
import { UpdateEWayBillVehicleDto } from './dto/update-eway-bill-vehicle.dto';

type Tx = any;

type ComplianceConfig = {
  provider: string;
  eInvoiceEnabled: boolean;
  eWayBillEnabled: boolean;
  autoGenerateOnIssue: boolean;
  defaultDistanceKm: number | null;
  defaultTransportMode: string;
};

type EligibilityResult = {
  status:
    | 'eligible'
    | 'blocked'
    | 'generated'
    | 'cancelled'
    | 'failed'
    | 'not_configured';
  reasons: string[];
};

@Injectable()
export class InvoiceComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  private getComplianceConfig(invoiceSettings: unknown): ComplianceConfig {
    const settings =
      invoiceSettings && typeof invoiceSettings === 'object'
        ? (invoiceSettings as Record<string, unknown>)
        : {};
    const compliance =
      settings.compliance && typeof settings.compliance === 'object'
        ? (settings.compliance as Record<string, unknown>)
        : {};

    const provider =
      typeof compliance.provider === 'string'
        ? compliance.provider
        : 'disabled';
    const defaultDistanceRaw = compliance.default_distance_km;

    return {
      provider,
      eInvoiceEnabled:
        provider !== 'disabled' && compliance.e_invoice_enabled !== false,
      eWayBillEnabled:
        provider !== 'disabled' && compliance.e_way_bill_enabled !== false,
      autoGenerateOnIssue: compliance.auto_generate_on_issue === true,
      defaultDistanceKm:
        typeof defaultDistanceRaw === 'number' &&
        Number.isFinite(defaultDistanceRaw) &&
        defaultDistanceRaw > 0
          ? Math.floor(defaultDistanceRaw)
          : null,
      defaultTransportMode:
        typeof compliance.default_transport_mode === 'string' &&
        compliance.default_transport_mode.trim()
          ? compliance.default_transport_mode.trim().toLowerCase()
          : 'road',
    };
  }

  private normalizeVehicleNumber(value?: string | null) {
    return value?.trim().toUpperCase() || null;
  }

  private computeHash(seed: string, length: number) {
    return createHash('sha256').update(seed).digest('hex').slice(0, length);
  }

  private toDigits(seed: string, length: number) {
    const digest = createHash('sha256').update(seed).digest();
    let digits = '';
    for (const byte of digest) {
      digits += String(byte % 10);
      if (digits.length >= length) break;
    }
    return digits.padEnd(length, '0').slice(0, length);
  }

  private async createEvent(args: {
    tx: Tx;
    companyId: string;
    invoiceId: string;
    eInvoiceDocumentId?: string | null;
    eWayBillDocumentId?: string | null;
    eventType: string;
    status?: string;
    summary: string;
    requestPayload?: Prisma.InputJsonValue;
    responsePayload?: Prisma.InputJsonValue;
    errorMessage?: string | null;
  }) {
    await (args.tx as any).invoiceComplianceEvent.create({
      data: {
        companyId: args.companyId,
        invoiceId: args.invoiceId,
        eInvoiceDocumentId: args.eInvoiceDocumentId ?? null,
        eWayBillDocumentId: args.eWayBillDocumentId ?? null,
        eventType: args.eventType,
        status: args.status ?? 'info',
        summary: args.summary,
        requestPayload: args.requestPayload,
        responsePayload: args.responsePayload,
        errorMessage: args.errorMessage ?? null,
      },
    });
  }

  private async loadInvoiceContext(
    tx: Tx,
    companyId: string,
    invoiceId: string,
  ) {
    const invoice = await (tx as any).invoice.findFirst({
      where: { id: invoiceId, companyId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            gstin: true,
            stateCode: true,
            invoiceSettings: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            gstin: true,
            stateCode: true,
          },
        },
        challan: {
          select: {
            id: true,
            challanNumber: true,
            transporterName: true,
            vehicleNumber: true,
            dispatchNotes: true,
          },
        },
        items: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            totalQuantity: true,
            unitPrice: true,
            hsnCode: true,
            taxRate: true,
            taxableValue: true,
            cgstAmount: true,
            sgstAmount: true,
            igstAmount: true,
            cessAmount: true,
            lineTotal: true,
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
        eInvoiceDocument: true,
        eWayBillDocument: true,
        complianceEvents: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  private evaluateEInvoiceEligibility(
    invoice: any,
    config: ComplianceConfig,
  ): EligibilityResult {
    const reasons: string[] = [];
    const record = invoice.eInvoiceDocument;

    if (!config.eInvoiceEnabled) {
      return { status: 'not_configured', reasons: ['E-invoice is disabled in company settings'] };
    }
    if (record?.status === 'generated') {
      return { status: 'generated', reasons: [] };
    }
    if (record?.status === 'cancelled') {
      return { status: 'cancelled', reasons: [] };
    }
    if (record?.status === 'failed') {
      return {
        status: 'failed',
        reasons:
          (Array.isArray(record.eligibilityReasons)
            ? (record.eligibilityReasons as string[])
            : []) || [record.lastError ?? 'Generation failed'],
      };
    }
    if (invoice.status !== 'issued') reasons.push('Only issued invoices are eligible');
    if (!invoice.invoiceNumber) reasons.push('Invoice number is missing');
    if (!invoice.issueDate) reasons.push('Issue date is missing');
    if (!invoice.company.gstin) reasons.push('Company GSTIN is missing');
    if (!invoice.company.stateCode) reasons.push('Company state code is missing');
    if (!(invoice.customerGstin || invoice.customer?.gstin)) {
      reasons.push('Customer GSTIN is missing');
    }

    return reasons.length > 0
      ? { status: 'blocked', reasons }
      : { status: 'eligible', reasons: [] };
  }

  private resolveEWayDefaults(invoice: any, config: ComplianceConfig) {
    const record = invoice.eWayBillDocument;
    return {
      transporterName:
        record?.transporterName ??
        invoice.challan?.transporterName ??
        null,
      vehicleNumber:
        record?.vehicleNumber ?? invoice.challan?.vehicleNumber ?? null,
      distanceKm: record?.distanceKm ?? config.defaultDistanceKm,
      transportMode:
        record?.transportMode ?? config.defaultTransportMode ?? 'road',
      transportDocumentNumber: record?.transportDocumentNumber ?? null,
      transportDocumentDate: record?.transportDocumentDate ?? null,
    };
  }

  private evaluateEWayBillEligibility(
    invoice: any,
    config: ComplianceConfig,
  ): EligibilityResult {
    const reasons: string[] = [];
    const record = invoice.eWayBillDocument;
    const defaults = this.resolveEWayDefaults(invoice, config);

    if (!config.eWayBillEnabled) {
      return { status: 'not_configured', reasons: ['E-way bill is disabled in company settings'] };
    }
    if (record?.status === 'generated') {
      return { status: 'generated', reasons: [] };
    }
    if (record?.status === 'cancelled') {
      return { status: 'cancelled', reasons: [] };
    }
    if (record?.status === 'failed') {
      return {
        status: 'failed',
        reasons:
          (Array.isArray(record.eligibilityReasons)
            ? (record.eligibilityReasons as string[])
            : []) || [record.lastError ?? 'Generation failed'],
      };
    }
    if (invoice.status !== 'issued') reasons.push('Only issued invoices are eligible');
    if (!invoice.invoiceNumber) reasons.push('Invoice number is missing');
    if (!invoice.issueDate) reasons.push('Issue date is missing');
    if (!invoice.company.gstin) reasons.push('Company GSTIN is missing');
    if (!invoice.company.stateCode) reasons.push('Company state code is missing');
    if (!(invoice.placeOfSupplyStateCode || invoice.customer?.stateCode || invoice.customerGstin || invoice.customer?.gstin)) {
      reasons.push('Place of supply or customer GST state is missing');
    }
    if (!defaults.transporterName) reasons.push('Transporter name is missing');
    if (!defaults.vehicleNumber) reasons.push('Vehicle number is missing');
    if (!defaults.distanceKm || defaults.distanceKm <= 0) {
      reasons.push('Transport distance is missing');
    }

    return reasons.length > 0
      ? { status: 'blocked', reasons }
      : { status: 'eligible', reasons: [] };
  }

  private buildEInvoicePayload(invoice: any) {
    return {
      invoice_id: invoice.id,
      invoice_number: invoice.invoiceNumber,
      issue_date: invoice.issueDate?.toISOString() ?? null,
      seller: {
        name: invoice.company.name,
        gstin: invoice.company.gstin,
        state_code: invoice.company.stateCode,
      },
      buyer: {
        name: invoice.customer.name,
        gstin: invoice.customerGstin ?? invoice.customer.gstin,
        state_code:
          invoice.placeOfSupplyStateCode ??
          invoice.customer.stateCode ??
          null,
      },
      totals: {
        sub_total: Number(invoice.subTotal.toString()),
        tax_total: Number(invoice.taxTotal.toString()),
        total: Number(invoice.total.toString()),
      },
      items: invoice.items.map((item: any) => ({
        product_id: item.productId,
        product_name: item.product?.name ?? null,
        sku: item.product?.sku ?? null,
        hsn_code: item.hsnCode ?? null,
        quantity: Number(item.totalQuantity.toString()),
        taxable_value: Number(item.taxableValue.toString()),
        tax_rate: Number(item.taxRate?.toString?.() ?? 0),
        line_total: Number(item.lineTotal.toString()),
      })),
    };
  }

  private buildEWayBillPayload(
    invoice: any,
    input: {
      transporterName: string;
      transporterId?: string | null;
      vehicleNumber: string;
      distanceKm: number;
      transportMode: string;
      transportDocumentNumber?: string | null;
      transportDocumentDate?: Date | null;
    },
  ) {
    return {
      invoice_id: invoice.id,
      invoice_number: invoice.invoiceNumber,
      issue_date: invoice.issueDate?.toISOString() ?? null,
      challan_number: invoice.challan?.challanNumber ?? null,
      seller_gstin: invoice.company.gstin,
      buyer_gstin: invoice.customerGstin ?? invoice.customer.gstin ?? null,
      place_of_supply_state_code:
        invoice.placeOfSupplyStateCode ?? invoice.customer.stateCode ?? null,
      totals: {
        total: Number(invoice.total.toString()),
      },
      transporter_name: input.transporterName,
      transporter_id: input.transporterId ?? null,
      vehicle_number: input.vehicleNumber,
      distance_km: input.distanceKm,
      transport_mode: input.transportMode,
      transport_document_number: input.transportDocumentNumber ?? null,
      transport_document_date:
        input.transportDocumentDate?.toISOString().slice(0, 10) ?? null,
    };
  }

  private formatSummary(invoice: any, config: ComplianceConfig) {
    const eInvoiceEligibility = this.evaluateEInvoiceEligibility(invoice, config);
    const eWayEligibility = this.evaluateEWayBillEligibility(invoice, config);

    return {
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoiceNumber,
        status: invoice.status,
        issue_date: invoice.issueDate?.toISOString().slice(0, 10) ?? null,
        total: Number(invoice.total.toString()),
        customer_name: invoice.customer.name,
      },
      provider: config.provider,
      config: {
        e_invoice_enabled: config.eInvoiceEnabled,
        e_way_bill_enabled: config.eWayBillEnabled,
        auto_generate_on_issue: config.autoGenerateOnIssue,
      },
      e_invoice: {
        status: invoice.eInvoiceDocument?.status ?? 'not_started',
        eligibility_status: eInvoiceEligibility.status,
        eligibility_reasons: eInvoiceEligibility.reasons,
        provider: invoice.eInvoiceDocument?.provider ?? config.provider,
        irn: invoice.eInvoiceDocument?.irn ?? null,
        ack_no: invoice.eInvoiceDocument?.ackNo ?? null,
        ack_date: invoice.eInvoiceDocument?.ackDate?.toISOString() ?? null,
        signed_qr_payload: invoice.eInvoiceDocument?.signedQrPayload ?? null,
        signed_invoice_json: invoice.eInvoiceDocument?.signedInvoiceJson ?? null,
        cancelled_at:
          invoice.eInvoiceDocument?.cancelledAt?.toISOString() ?? null,
        cancellation_reason: invoice.eInvoiceDocument?.cancellationReason ?? null,
        last_synced_at:
          invoice.eInvoiceDocument?.lastSyncedAt?.toISOString() ?? null,
        last_error: invoice.eInvoiceDocument?.lastError ?? null,
      },
      e_way_bill: {
        status: invoice.eWayBillDocument?.status ?? 'not_started',
        eligibility_status: eWayEligibility.status,
        eligibility_reasons: eWayEligibility.reasons,
        provider: invoice.eWayBillDocument?.provider ?? config.provider,
        eway_bill_number: invoice.eWayBillDocument?.ewayBillNumber ?? null,
        transporter_name: invoice.eWayBillDocument?.transporterName ?? invoice.challan?.transporterName ?? null,
        transporter_id: invoice.eWayBillDocument?.transporterId ?? null,
        vehicle_number: invoice.eWayBillDocument?.vehicleNumber ?? invoice.challan?.vehicleNumber ?? null,
        transport_mode: invoice.eWayBillDocument?.transportMode ?? config.defaultTransportMode,
        distance_km:
          invoice.eWayBillDocument?.distanceKm ?? config.defaultDistanceKm,
        transport_document_number:
          invoice.eWayBillDocument?.transportDocumentNumber ?? null,
        transport_document_date:
          invoice.eWayBillDocument?.transportDocumentDate?.toISOString().slice(0, 10) ?? null,
        valid_from:
          invoice.eWayBillDocument?.validFrom?.toISOString() ?? null,
        valid_until:
          invoice.eWayBillDocument?.validUntil?.toISOString() ?? null,
        cancelled_at:
          invoice.eWayBillDocument?.cancelledAt?.toISOString() ?? null,
        cancellation_reason: invoice.eWayBillDocument?.cancellationReason ?? null,
        last_synced_at:
          invoice.eWayBillDocument?.lastSyncedAt?.toISOString() ?? null,
        last_error: invoice.eWayBillDocument?.lastError ?? null,
      },
      events: (invoice.complianceEvents ?? []).map((event: any) => ({
        id: event.id,
        event_type: event.eventType,
        status: event.status,
        summary: event.summary,
        error_message: event.errorMessage,
        created_at: event.createdAt.toISOString(),
      })),
    };
  }

  async getInvoiceCompliance(args: { companyId: string; invoiceId: string }) {
    const invoice = await this.loadInvoiceContext(
      this.prisma,
      args.companyId,
      args.invoiceId,
    );
    const config = this.getComplianceConfig(invoice.company.invoiceSettings);
    return { data: this.formatSummary(invoice, config) };
  }

  async generateEInvoice(args: { companyId: string; invoiceId: string }) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await this.loadInvoiceContext(tx, args.companyId, args.invoiceId);
      const config = this.getComplianceConfig(invoice.company.invoiceSettings);
      const eligibility = this.evaluateEInvoiceEligibility(invoice, config);

      if (eligibility.status === 'generated' && invoice.eInvoiceDocument) {
        return { data: this.formatSummary(invoice, config) };
      }

      if (eligibility.status !== 'eligible') {
        const failed = await tx.eInvoiceDocument.upsert({
          where: { invoiceId: invoice.id },
          update: {
            provider: config.provider,
            status: 'failed',
            eligibilityStatus: eligibility.status,
            eligibilityReasons: eligibility.reasons as Prisma.InputJsonValue,
            lastError: eligibility.reasons.join('; '),
            updatedAt: new Date(),
          },
          create: {
            companyId: args.companyId,
            invoiceId: invoice.id,
            provider: config.provider,
            status: 'failed',
            eligibilityStatus: eligibility.status,
            eligibilityReasons: eligibility.reasons as Prisma.InputJsonValue,
            lastError: eligibility.reasons.join('; '),
          },
        });
        await this.createEvent({
          tx,
          companyId: args.companyId,
          invoiceId: invoice.id,
          eInvoiceDocumentId: failed.id,
          eventType: 'e_invoice.generate_failed',
          status: 'error',
          summary: 'E-invoice generation blocked',
          errorMessage: eligibility.reasons.join('; '),
        });
        throw new BadRequestException(
          eligibility.reasons.join('; ') || 'Invoice is not eligible for e-invoice',
        );
      }

      const payload = this.buildEInvoicePayload(invoice);
      const seed = `${invoice.company.gstin}:${invoice.invoiceNumber}:${invoice.issueDate?.toISOString() ?? ''}`;
      const irn = this.computeHash(seed, 64);
      const ackNo = this.toDigits(`${seed}:ack`, 14);
      const ackDate = new Date();
      const qrPayload = JSON.stringify({
        irn,
        invoice_number: invoice.invoiceNumber,
        seller_gstin: invoice.company.gstin,
        total: Number(invoice.total.toString()),
        ack_no: ackNo,
      });
      const responsePayload = {
        provider: config.provider,
        irn,
        ack_no: ackNo,
        ack_date: ackDate.toISOString(),
      };

      const record = await tx.eInvoiceDocument.upsert({
        where: { invoiceId: invoice.id },
        update: {
          provider: config.provider,
          status: 'generated',
          eligibilityStatus: 'eligible',
          eligibilityReasons: [] as Prisma.InputJsonValue,
          irn,
          ackNo,
          ackDate,
          signedInvoiceJson: payload as Prisma.InputJsonValue,
          signedQrPayload: qrPayload,
          requestPayload: payload as Prisma.InputJsonValue,
          responsePayload: responsePayload as Prisma.InputJsonValue,
          cancellationReason: null,
          cancelledAt: null,
          lastSyncedAt: ackDate,
          lastError: null,
          updatedAt: ackDate,
        },
        create: {
          companyId: args.companyId,
          invoiceId: invoice.id,
          provider: config.provider,
          status: 'generated',
          eligibilityStatus: 'eligible',
          eligibilityReasons: [] as Prisma.InputJsonValue,
          irn,
          ackNo,
          ackDate,
          signedInvoiceJson: payload as Prisma.InputJsonValue,
          signedQrPayload: qrPayload,
          requestPayload: payload as Prisma.InputJsonValue,
          responsePayload: responsePayload as Prisma.InputJsonValue,
          lastSyncedAt: ackDate,
        },
      });

      await this.createEvent({
        tx,
        companyId: args.companyId,
        invoiceId: invoice.id,
        eInvoiceDocumentId: record.id,
        eventType: 'e_invoice.generated',
        status: 'success',
        summary: `IRN generated for ${invoice.invoiceNumber}`,
        requestPayload: payload as Prisma.InputJsonValue,
        responsePayload: responsePayload as Prisma.InputJsonValue,
      });

      const updated = await this.loadInvoiceContext(tx, args.companyId, invoice.id);
      return { data: this.formatSummary(updated, config) };
    });
  }

  async cancelEInvoice(args: {
    companyId: string;
    invoiceId: string;
    reason?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await this.loadInvoiceContext(tx, args.companyId, args.invoiceId);
      const config = this.getComplianceConfig(invoice.company.invoiceSettings);
      if (!invoice.eInvoiceDocument || invoice.eInvoiceDocument.status !== 'generated') {
        throw new ConflictException('No active e-invoice found for cancellation');
      }

      const cancelledAt = new Date();
      const reason = args.reason?.trim() || 'operator_cancelled';

      const record = await tx.eInvoiceDocument.update({
        where: { invoiceId: invoice.id },
        data: {
          status: 'cancelled',
          cancellationReason: reason,
          cancelledAt,
          lastSyncedAt: cancelledAt,
          updatedAt: cancelledAt,
        },
      });

      await this.createEvent({
        tx,
        companyId: args.companyId,
        invoiceId: invoice.id,
        eInvoiceDocumentId: record.id,
        eventType: 'e_invoice.cancelled',
        status: 'success',
        summary: `IRN cancelled for ${invoice.invoiceNumber}`,
        responsePayload: {
          cancelled_at: cancelledAt.toISOString(),
          reason,
        } as Prisma.InputJsonValue,
      });

      const updated = await this.loadInvoiceContext(tx, args.companyId, invoice.id);
      return { data: this.formatSummary(updated, config) };
    });
  }

  async syncEInvoice(args: { companyId: string; invoiceId: string }) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await this.loadInvoiceContext(tx, args.companyId, args.invoiceId);
      const config = this.getComplianceConfig(invoice.company.invoiceSettings);
      if (!invoice.eInvoiceDocument) {
        return { data: this.formatSummary(invoice, config) };
      }

      const syncedAt = new Date();
      const record = await tx.eInvoiceDocument.update({
        where: { invoiceId: invoice.id },
        data: {
          lastSyncedAt: syncedAt,
          updatedAt: syncedAt,
        },
      });

      await this.createEvent({
        tx,
        companyId: args.companyId,
        invoiceId: invoice.id,
        eInvoiceDocumentId: record.id,
        eventType: 'e_invoice.synced',
        status: 'success',
        summary: `E-invoice status synced for ${invoice.invoiceNumber}`,
        responsePayload: { synced_at: syncedAt.toISOString() } as Prisma.InputJsonValue,
      });

      const updated = await this.loadInvoiceContext(tx, args.companyId, invoice.id);
      return { data: this.formatSummary(updated, config) };
    });
  }

  async generateEWayBill(args: {
    companyId: string;
    invoiceId: string;
    dto: GenerateEWayBillDto;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await this.loadInvoiceContext(tx, args.companyId, args.invoiceId);
      const config = this.getComplianceConfig(invoice.company.invoiceSettings);
      const defaults = this.resolveEWayDefaults(invoice, config);
      const transporterName =
        args.dto.transporter_name?.trim() || defaults.transporterName || null;
      const vehicleNumber = this.normalizeVehicleNumber(
        args.dto.vehicle_number ?? defaults.vehicleNumber,
      );
      const distanceKm = args.dto.distance_km ?? defaults.distanceKm ?? null;
      const transportMode =
        args.dto.transport_mode?.trim().toLowerCase() ||
        defaults.transportMode ||
        'road';
      const transportDocumentNumber =
        args.dto.transport_document_number?.trim() ||
        defaults.transportDocumentNumber ||
        null;
      const transportDocumentDate = args.dto.transport_document_date
        ? new Date(args.dto.transport_document_date)
        : defaults.transportDocumentDate;

      const baseEligibility = this.evaluateEWayBillEligibility(invoice, {
        ...config,
        defaultDistanceKm: distanceKm,
        defaultTransportMode: transportMode,
      });

      if (baseEligibility.status === 'generated' && invoice.eWayBillDocument) {
        return { data: this.formatSummary(invoice, config) };
      }

      if (
        baseEligibility.status !== 'eligible' &&
        baseEligibility.status !== 'generated'
      ) {
        const failed = await tx.eWayBillDocument.upsert({
          where: { invoiceId: invoice.id },
          update: {
            provider: config.provider,
            status: 'failed',
            eligibilityStatus: baseEligibility.status,
            eligibilityReasons: baseEligibility.reasons as Prisma.InputJsonValue,
            transporterName,
            transporterId: args.dto.transporter_id?.trim() || null,
            vehicleNumber,
            distanceKm,
            transportMode,
            transportDocumentNumber,
            transportDocumentDate,
            lastError: baseEligibility.reasons.join('; '),
            updatedAt: new Date(),
          },
          create: {
            companyId: args.companyId,
            invoiceId: invoice.id,
            provider: config.provider,
            status: 'failed',
            eligibilityStatus: baseEligibility.status,
            eligibilityReasons: baseEligibility.reasons as Prisma.InputJsonValue,
            transporterName,
            transporterId: args.dto.transporter_id?.trim() || null,
            vehicleNumber,
            distanceKm,
            transportMode,
            transportDocumentNumber,
            transportDocumentDate,
            lastError: baseEligibility.reasons.join('; '),
          },
        });
        await this.createEvent({
          tx,
          companyId: args.companyId,
          invoiceId: invoice.id,
          eWayBillDocumentId: failed.id,
          eventType: 'e_way_bill.generate_failed',
          status: 'error',
          summary: 'E-way bill generation blocked',
          errorMessage: baseEligibility.reasons.join('; '),
        });
        throw new BadRequestException(
          baseEligibility.reasons.join('; ') ||
            'Invoice is not eligible for e-way bill',
        );
      }

      const requestPayload = this.buildEWayBillPayload(invoice, {
        transporterName: transporterName || 'Unknown transporter',
        transporterId: args.dto.transporter_id?.trim() || null,
        vehicleNumber: vehicleNumber || 'UNKNOWN',
        distanceKm: distanceKm || 0,
        transportMode,
        transportDocumentNumber,
        transportDocumentDate,
      });
      const seed = `${invoice.company.gstin}:${invoice.invoiceNumber}:${vehicleNumber}:${distanceKm}`;
      const ewayBillNumber = this.toDigits(`${seed}:eway`, 12);
      const validFrom = new Date();
      const validUntil = new Date(
        validFrom.getTime() +
          Math.max(1, Math.ceil((distanceKm || 1) / 200)) * 86_400_000,
      );
      const responsePayload = {
        provider: config.provider,
        eway_bill_number: ewayBillNumber,
        valid_from: validFrom.toISOString(),
        valid_until: validUntil.toISOString(),
      };

      const record = await tx.eWayBillDocument.upsert({
        where: { invoiceId: invoice.id },
        update: {
          provider: config.provider,
          status: 'generated',
          eligibilityStatus: 'eligible',
          eligibilityReasons: [] as Prisma.InputJsonValue,
          ewayBillNumber,
          transporterName,
          transporterId: args.dto.transporter_id?.trim() || null,
          vehicleNumber,
          distanceKm,
          transportMode,
          transportDocumentNumber,
          transportDocumentDate,
          validFrom,
          validUntil,
          requestPayload: requestPayload as Prisma.InputJsonValue,
          responsePayload: responsePayload as Prisma.InputJsonValue,
          cancellationReason: null,
          cancelledAt: null,
          lastSyncedAt: validFrom,
          lastError: null,
          updatedAt: validFrom,
        },
        create: {
          companyId: args.companyId,
          invoiceId: invoice.id,
          provider: config.provider,
          status: 'generated',
          eligibilityStatus: 'eligible',
          eligibilityReasons: [] as Prisma.InputJsonValue,
          ewayBillNumber,
          transporterName,
          transporterId: args.dto.transporter_id?.trim() || null,
          vehicleNumber,
          distanceKm,
          transportMode,
          transportDocumentNumber,
          transportDocumentDate,
          validFrom,
          validUntil,
          requestPayload: requestPayload as Prisma.InputJsonValue,
          responsePayload: responsePayload as Prisma.InputJsonValue,
          lastSyncedAt: validFrom,
        },
      });

      await this.createEvent({
        tx,
        companyId: args.companyId,
        invoiceId: invoice.id,
        eWayBillDocumentId: record.id,
        eventType: 'e_way_bill.generated',
        status: 'success',
        summary: `E-way bill generated for ${invoice.invoiceNumber}`,
        requestPayload: requestPayload as Prisma.InputJsonValue,
        responsePayload: responsePayload as Prisma.InputJsonValue,
      });

      const updated = await this.loadInvoiceContext(tx, args.companyId, invoice.id);
      return { data: this.formatSummary(updated, config) };
    });
  }

  async updateEWayBillVehicle(args: {
    companyId: string;
    invoiceId: string;
    dto: UpdateEWayBillVehicleDto;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await this.loadInvoiceContext(tx, args.companyId, args.invoiceId);
      const config = this.getComplianceConfig(invoice.company.invoiceSettings);
      if (!invoice.eWayBillDocument || invoice.eWayBillDocument.status !== 'generated') {
        throw new ConflictException('No active e-way bill found for vehicle update');
      }

      const updatedAt = new Date();
      const vehicleNumber = this.normalizeVehicleNumber(args.dto.vehicle_number);
      const record = await tx.eWayBillDocument.update({
        where: { invoiceId: invoice.id },
        data: {
          vehicleNumber,
          transporterName: args.dto.transporter_name?.trim() || invoice.eWayBillDocument.transporterName,
          transportMode: args.dto.transport_mode?.trim().toLowerCase() || invoice.eWayBillDocument.transportMode,
          distanceKm: args.dto.distance_km ?? invoice.eWayBillDocument.distanceKm,
          transportDocumentNumber:
            args.dto.transport_document_number?.trim() ||
            invoice.eWayBillDocument.transportDocumentNumber,
          transportDocumentDate: args.dto.transport_document_date
            ? new Date(args.dto.transport_document_date)
            : invoice.eWayBillDocument.transportDocumentDate,
          lastSyncedAt: updatedAt,
          updatedAt,
        },
      });

      await this.createEvent({
        tx,
        companyId: args.companyId,
        invoiceId: invoice.id,
        eWayBillDocumentId: record.id,
        eventType: 'e_way_bill.vehicle_updated',
        status: 'success',
        summary: `Vehicle updated to ${vehicleNumber}`,
        responsePayload: {
          vehicle_number: vehicleNumber,
          updated_at: updatedAt.toISOString(),
        } as Prisma.InputJsonValue,
      });

      const updated = await this.loadInvoiceContext(tx, args.companyId, invoice.id);
      return { data: this.formatSummary(updated, config) };
    });
  }

  async cancelEWayBill(args: {
    companyId: string;
    invoiceId: string;
    reason?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await this.loadInvoiceContext(tx, args.companyId, args.invoiceId);
      const config = this.getComplianceConfig(invoice.company.invoiceSettings);
      if (!invoice.eWayBillDocument || invoice.eWayBillDocument.status !== 'generated') {
        throw new ConflictException('No active e-way bill found for cancellation');
      }

      const cancelledAt = new Date();
      const reason = args.reason?.trim() || 'operator_cancelled';
      const record = await tx.eWayBillDocument.update({
        where: { invoiceId: invoice.id },
        data: {
          status: 'cancelled',
          cancellationReason: reason,
          cancelledAt,
          lastSyncedAt: cancelledAt,
          updatedAt: cancelledAt,
        },
      });

      await this.createEvent({
        tx,
        companyId: args.companyId,
        invoiceId: invoice.id,
        eWayBillDocumentId: record.id,
        eventType: 'e_way_bill.cancelled',
        status: 'success',
        summary: `E-way bill cancelled for ${invoice.invoiceNumber}`,
        responsePayload: {
          cancelled_at: cancelledAt.toISOString(),
          reason,
        } as Prisma.InputJsonValue,
      });

      const updated = await this.loadInvoiceContext(tx, args.companyId, invoice.id);
      return { data: this.formatSummary(updated, config) };
    });
  }

  async syncEWayBill(args: { companyId: string; invoiceId: string }) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await this.loadInvoiceContext(tx, args.companyId, args.invoiceId);
      const config = this.getComplianceConfig(invoice.company.invoiceSettings);
      if (!invoice.eWayBillDocument) {
        return { data: this.formatSummary(invoice, config) };
      }

      const syncedAt = new Date();
      const record = await tx.eWayBillDocument.update({
        where: { invoiceId: invoice.id },
        data: {
          lastSyncedAt: syncedAt,
          updatedAt: syncedAt,
        },
      });

      await this.createEvent({
        tx,
        companyId: args.companyId,
        invoiceId: invoice.id,
        eWayBillDocumentId: record.id,
        eventType: 'e_way_bill.synced',
        status: 'success',
        summary: `E-way bill status synced for ${invoice.invoiceNumber}`,
        responsePayload: { synced_at: syncedAt.toISOString() } as Prisma.InputJsonValue,
      });

      const updated = await this.loadInvoiceContext(tx, args.companyId, invoice.id);
      return { data: this.formatSummary(updated, config) };
    });
  }

  async listExceptions(args: { companyId: string; q?: string; limit: number }) {
    const invoices = (await (this.prisma as any).invoice.findMany({
      where: {
        companyId: args.companyId,
        status: 'issued',
        ...(args.q
          ? {
              OR: [
                {
                  invoiceNumber: {
                    contains: args.q,
                    mode: 'insensitive',
                  },
                },
                { customer: { name: { contains: args.q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      take: args.limit,
      orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
      include: {
        company: {
          select: { invoiceSettings: true, gstin: true, stateCode: true },
        },
        customer: {
          select: { name: true, gstin: true, stateCode: true },
        },
        challan: {
          select: { transporterName: true, vehicleNumber: true },
        },
        eInvoiceDocument: true,
        eWayBillDocument: true,
      },
    })) as any[];

    const rows = invoices
      .map((invoice) => {
        const config = this.getComplianceConfig(invoice.company.invoiceSettings);
        const eInvoiceEligibility = this.evaluateEInvoiceEligibility(
          invoice as any,
          config,
        );
        const eWayEligibility = this.evaluateEWayBillEligibility(
          invoice as any,
          config,
        );
        const eInvoiceStatus = invoice.eInvoiceDocument?.status ?? 'not_started';
        const eWayStatus = invoice.eWayBillDocument?.status ?? 'not_started';

        const hasException =
          (config.eInvoiceEnabled &&
            !['generated', 'cancelled'].includes(eInvoiceStatus)) ||
          (config.eWayBillEnabled &&
            !['generated', 'cancelled'].includes(eWayStatus));

        if (!hasException) return null;

        return {
          invoice_id: invoice.id,
          invoice_number: invoice.invoiceNumber ?? invoice.id,
          issue_date: invoice.issueDate?.toISOString().slice(0, 10) ?? null,
          customer_name: invoice.customer.name,
          total: Number(invoice.total.toString()),
          e_invoice_status: eInvoiceStatus,
          e_invoice_eligibility_status: eInvoiceEligibility.status,
          e_invoice_reason: eInvoiceEligibility.reasons[0] ?? null,
          e_way_bill_status: eWayStatus,
          e_way_bill_eligibility_status: eWayEligibility.status,
          e_way_bill_reason: eWayEligibility.reasons[0] ?? null,
        };
      })
      .filter(Boolean);

    return {
      data: rows,
      meta: {
        limit: args.limit,
      },
    };
  }

  async assertNoActiveComplianceForInvoiceCancellation(args: {
    tx: Tx;
    companyId: string;
    invoiceId: string;
  }) {
    const [eInvoice, eWayBill] = await Promise.all([
      args.tx.eInvoiceDocument.findFirst({
        where: {
          companyId: args.companyId,
          invoiceId: args.invoiceId,
          status: 'generated',
        },
        select: { irn: true },
      }),
      args.tx.eWayBillDocument.findFirst({
        where: {
          companyId: args.companyId,
          invoiceId: args.invoiceId,
          status: 'generated',
        },
        select: { ewayBillNumber: true },
      }),
    ]);

    if (eInvoice?.irn) {
      throw new ConflictException(
        'Cancel the active e-invoice before cancelling the invoice',
      );
    }
    if (eWayBill?.ewayBillNumber) {
      throw new ConflictException(
        'Cancel the active e-way bill before cancelling the invoice',
      );
    }
  }
}
