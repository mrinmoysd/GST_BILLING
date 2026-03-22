import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import * as fs from 'fs';
import * as path from 'path';

import { PrismaService } from '../prisma/prisma.service';
import { toCsv } from '../exports/csv.util';

type GstReportType = 'gstr1' | 'gstr3b' | 'hsn' | 'itc';
type GstExportFormat = 'json' | 'csv' | 'excel';

type TaxSplit = {
  taxableValue: Decimal;
  taxRate: Decimal;
  cgstAmount: Decimal;
  sgstAmount: Decimal;
  igstAmount: Decimal;
  cessAmount: Decimal;
  taxTotal: Decimal;
  isInterState: boolean;
};

@Injectable()
export class GstService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly gstr1InvoiceInclude = Prisma.validator<Prisma.InvoiceInclude>()({
    customer: {
      select: {
        id: true,
        name: true,
        gstin: true,
        stateCode: true,
        shippingAddress: true,
        billingAddress: true,
      },
    },
    items: {
      include: {
        product: {
          select: {
            id: true,
            name: true,
            hsn: true,
          },
        },
      },
    },
    creditNotes: {
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                hsn: true,
              },
            },
          },
        },
      },
    },
  });

  private readonly itcPurchaseInclude = Prisma.validator<Prisma.PurchaseInclude>()({
    supplier: {
      select: {
        id: true,
        name: true,
        gstin: true,
        stateCode: true,
        address: true,
      },
    },
    items: {
      include: {
        product: {
          select: {
            id: true,
            hsn: true,
          },
        },
      },
    },
    purchaseReturns: {
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                hsn: true,
              },
            },
          },
        },
      },
    },
  });

  private decimal(value: unknown, fallback = '0') {
    if (value === null || value === undefined) return new Decimal(fallback);
    return new Decimal(value as any);
  }

  private getStorageDir() {
    return path.join(process.cwd(), 'storage', 'gst-exports');
  }

  getExportStorageDir() {
    return this.getStorageDir();
  }

  private normalizeStateCode(input?: string | null) {
    const value = (input ?? '').trim();
    return value ? value.slice(0, 2) : null;
  }

  private getJsonStateCode(value: unknown): string | null {
    if (!value || typeof value !== 'object') return null;
    const row = value as Record<string, unknown>;
    const candidate =
      row.state_code ??
      row.stateCode ??
      row.pos_state_code ??
      row.posStateCode ??
      row.gstin_state_code;
    if (typeof candidate === 'string' && candidate.trim()) {
      return this.normalizeStateCode(candidate);
    }
    const gstin = row.gstin;
    if (typeof gstin === 'string' && gstin.trim().length >= 2) {
      return gstin.trim().slice(0, 2);
    }
    return null;
  }

  private deriveCustomerPosState(customer: {
    shippingAddress?: unknown | null;
    billingAddress?: unknown | null;
    stateCode?: string | null;
    gstin?: string | null;
  }) {
    return (
      this.getJsonStateCode(customer.shippingAddress) ??
      this.getJsonStateCode(customer.billingAddress) ??
      this.normalizeStateCode(customer.stateCode) ??
      (customer.gstin ? customer.gstin.slice(0, 2) : null)
    );
  }

  private deriveSupplierPosState(supplier: {
    address?: unknown | null;
    stateCode?: string | null;
    gstin?: string | null;
  }) {
    return (
      this.getJsonStateCode(supplier.address) ??
      this.normalizeStateCode(supplier.stateCode) ??
      (supplier.gstin ? supplier.gstin.slice(0, 2) : null)
    );
  }

  computeTaxSplit(args: {
    companyStateCode?: string | null;
    placeOfSupplyStateCode?: string | null;
    taxableValue: Decimal;
    taxRate?: Decimal | null;
  }): TaxSplit {
    const taxRate = args.taxRate ?? new Decimal(0);
    const taxableValue = args.taxableValue;
    const taxTotal = taxableValue.mul(taxRate).div(100);
    const companyStateCode = this.normalizeStateCode(args.companyStateCode);
    const posStateCode = this.normalizeStateCode(args.placeOfSupplyStateCode);
    const isInterState = Boolean(
      companyStateCode &&
        posStateCode &&
        companyStateCode !== posStateCode,
    );

    if (taxRate.eq(0)) {
      return {
        taxableValue,
        taxRate,
        cgstAmount: new Decimal(0),
        sgstAmount: new Decimal(0),
        igstAmount: new Decimal(0),
        cessAmount: new Decimal(0),
        taxTotal: new Decimal(0),
        isInterState,
      };
    }

    if (isInterState) {
      return {
        taxableValue,
        taxRate,
        cgstAmount: new Decimal(0),
        sgstAmount: new Decimal(0),
        igstAmount: taxTotal,
        cessAmount: new Decimal(0),
        taxTotal,
        isInterState,
      };
    }

    const half = taxTotal.div(2);
    return {
      taxableValue,
      taxRate,
      cgstAmount: half,
      sgstAmount: half,
      igstAmount: new Decimal(0),
      cessAmount: new Decimal(0),
      taxTotal,
      isInterState,
    };
  }

  async resolveSalesContext(companyId: string, customerId: string) {
    const [company, customer] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, stateCode: true, gstin: true },
      }),
      this.prisma.customer.findFirst({
        where: { id: customerId, companyId, deletedAt: null },
        select: {
          id: true,
          gstin: true,
          stateCode: true,
          shippingAddress: true,
          billingAddress: true,
        },
      }),
    ]);
    if (!company) throw new NotFoundException('Company not found');
    if (!customer) throw new NotFoundException('Customer not found');

    const placeOfSupplyStateCode = this.deriveCustomerPosState(customer);
    return {
      companyStateCode: company.stateCode,
      placeOfSupplyStateCode,
      customerGstin: customer.gstin ?? null,
    };
  }

  async resolvePurchaseContext(companyId: string, supplierId: string) {
    const [company, supplier] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, stateCode: true, gstin: true },
      }),
      this.prisma.supplier.findFirst({
        where: { id: supplierId, companyId, deletedAt: null },
        select: {
          id: true,
          gstin: true,
          stateCode: true,
          address: true,
        },
      }),
    ]);
    if (!company) throw new NotFoundException('Company not found');
    if (!supplier) throw new NotFoundException('Supplier not found');

    const placeOfSupplyStateCode = this.deriveSupplierPosState(supplier);
    return {
      companyStateCode: company.stateCode,
      placeOfSupplyStateCode,
      supplierGstin: supplier.gstin ?? null,
    };
  }

  private inferItemTaxSplit(args: {
    companyStateCode?: string | null;
    posStateCode?: string | null;
    lineSubTotal: unknown;
    taxRate?: unknown;
    taxableValue?: unknown;
    cgstAmount?: unknown;
    sgstAmount?: unknown;
    igstAmount?: unknown;
    cessAmount?: unknown;
  }) {
    const stored = {
      taxableValue: this.decimal(args.taxableValue),
      cgstAmount: this.decimal(args.cgstAmount),
      sgstAmount: this.decimal(args.sgstAmount),
      igstAmount: this.decimal(args.igstAmount),
      cessAmount: this.decimal(args.cessAmount),
    };
    const hasStored =
      stored.taxableValue.gt(0) ||
      stored.cgstAmount.gt(0) ||
      stored.sgstAmount.gt(0) ||
      stored.igstAmount.gt(0) ||
      stored.cessAmount.gt(0);
    if (hasStored) {
      const taxRate = this.decimal(args.taxRate);
      return {
        taxableValue: stored.taxableValue,
        taxRate,
        cgstAmount: stored.cgstAmount,
        sgstAmount: stored.sgstAmount,
        igstAmount: stored.igstAmount,
        cessAmount: stored.cessAmount,
        taxTotal: stored.cgstAmount
          .add(stored.sgstAmount)
          .add(stored.igstAmount)
          .add(stored.cessAmount),
      };
    }
    return this.computeTaxSplit({
      companyStateCode: args.companyStateCode,
      placeOfSupplyStateCode: args.posStateCode,
      taxableValue: this.decimal(args.taxableValue ?? args.lineSubTotal),
      taxRate: this.decimal(args.taxRate),
    });
  }

  private getPeriodWhere(args: { from?: string; to?: string }, dateField: string) {
    if (!args.from && !args.to) return undefined;
    return {
      [dateField]: {
        ...(args.from ? { gte: new Date(args.from) } : {}),
        ...(args.to ? { lte: new Date(args.to) } : {}),
      },
    };
  }

  async getGstr1(args: { companyId: string; from?: string; to?: string }) {
    const company = await this.prisma.company.findUnique({
      where: { id: args.companyId },
      select: { gstin: true, stateCode: true, name: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    const invoices = await this.prisma.invoice.findMany({
      where: {
        companyId: args.companyId,
        status: { in: ['issued', 'paid', 'credited_partial', 'credited'] },
        ...this.getPeriodWhere(args, 'issueDate'),
      },
      include: this.gstr1InvoiceInclude,
      orderBy: { issueDate: 'asc' },
    });

    const b2b: any[] = [];
    const b2c: any[] = [];
    const cdnr: any[] = [];
    const hsnMap = new Map<string, any>();
    const warnings: string[] = [];

    for (const invoice of invoices) {
      const posStateCode =
        invoice.placeOfSupplyStateCode ??
        this.deriveCustomerPosState(invoice.customer);
      if (!posStateCode) {
        warnings.push(`Invoice ${invoice.invoiceNumber ?? invoice.id} is missing place of supply`);
      }

      const items = invoice.items.map((item) => {
        const split = this.inferItemTaxSplit({
          companyStateCode: company.stateCode,
          posStateCode,
          lineSubTotal: item.lineSubTotal,
          taxRate: item.taxRate,
          taxableValue: item.taxableValue,
          cgstAmount: item.cgstAmount,
          sgstAmount: item.sgstAmount,
          igstAmount: item.igstAmount,
          cessAmount: item.cessAmount,
        });

        const hsnCode = item.hsnCode ?? item.product.hsn ?? 'UNSPECIFIED';
        const hsnKey = `${hsnCode}|${split.taxRate.toString()}`;
        const hsn = hsnMap.get(hsnKey) ?? {
          hsn_code: hsnCode,
          rate: split.taxRate.toString(),
          quantity: 0,
          taxable_value: 0,
          cgst_amount: 0,
          sgst_amount: 0,
          igst_amount: 0,
          cess_amount: 0,
        };
        hsn.quantity += Number(item.quantity);
        hsn.taxable_value += Number(split.taxableValue);
        hsn.cgst_amount += Number(split.cgstAmount);
        hsn.sgst_amount += Number(split.sgstAmount);
        hsn.igst_amount += Number(split.igstAmount);
        hsn.cess_amount += Number(split.cessAmount);
        hsnMap.set(hsnKey, hsn);

        return {
          product_id: item.productId,
          product_name: item.product.name,
          hsn_code: hsnCode,
          quantity: item.quantity.toString(),
          taxable_value: split.taxableValue.toString(),
          rate: split.taxRate.toString(),
          cgst_amount: split.cgstAmount.toString(),
          sgst_amount: split.sgstAmount.toString(),
          igst_amount: split.igstAmount.toString(),
          cess_amount: split.cessAmount.toString(),
          line_total: item.lineTotal.toString(),
        };
      });

      const row = {
        invoice_number: invoice.invoiceNumber ?? '',
        invoice_date: invoice.issueDate?.toISOString().slice(0, 10) ?? '',
        customer_name: invoice.customer.name,
        customer_gstin: invoice.customerGstin ?? invoice.customer.gstin ?? '',
        pos_state_code: posStateCode ?? '',
        taxable_value: invoice.subTotal.toString(),
        cgst_amount: items.reduce((sum, item) => sum + Number(item.cgst_amount), 0).toFixed(2),
        sgst_amount: items.reduce((sum, item) => sum + Number(item.sgst_amount), 0).toFixed(2),
        igst_amount: items.reduce((sum, item) => sum + Number(item.igst_amount), 0).toFixed(2),
        cess_amount: items.reduce((sum, item) => sum + Number(item.cess_amount), 0).toFixed(2),
        invoice_value: invoice.total.toString(),
        status: invoice.status,
        items,
      };

      if (row.customer_gstin) {
        b2b.push(row);
      } else {
        b2c.push(row);
      }

      for (const note of invoice.creditNotes) {
        cdnr.push({
          note_number: note.noteNumber,
          note_date: note.noteDate.toISOString().slice(0, 10),
          invoice_number: invoice.invoiceNumber ?? invoice.id,
          customer_gstin: invoice.customerGstin ?? invoice.customer.gstin ?? '',
          kind: note.kind,
          total: note.total.toString(),
          items: note.items.map((item) => {
            const split = this.inferItemTaxSplit({
              companyStateCode: company.stateCode,
              posStateCode,
              lineSubTotal: item.lineSubTotal,
              taxRate: item.taxRate,
              taxableValue: item.taxableValue,
              cgstAmount: item.cgstAmount,
              sgstAmount: item.sgstAmount,
              igstAmount: item.igstAmount,
              cessAmount: item.cessAmount,
            });
            return {
              product_id: item.productId,
              hsn_code: item.hsnCode ?? item.product.hsn ?? 'UNSPECIFIED',
              taxable_value: split.taxableValue.toString(),
              rate: split.taxRate.toString(),
              cgst_amount: split.cgstAmount.toString(),
              sgst_amount: split.sgstAmount.toString(),
              igst_amount: split.igstAmount.toString(),
              cess_amount: split.cessAmount.toString(),
            };
          }),
        });
      }
    }

    return {
      company: {
        name: company.name,
        gstin: company.gstin,
        state_code: company.stateCode,
      },
      period: { from: args.from ?? null, to: args.to ?? null },
      summary: {
        invoice_count: invoices.length,
        b2b_count: b2b.length,
        b2c_count: b2c.length,
        credit_note_count: cdnr.length,
      },
      b2b,
      b2c,
      cdnr,
      hsn_summary: Array.from(hsnMap.values()),
      warnings,
      reconciliation: {
        outward_taxable_value: invoices.reduce(
          (sum, invoice) => sum + Number(invoice.subTotal),
          0,
        ),
        credit_note_value: cdnr.reduce(
          (sum, note) => sum + Number(note.total),
          0,
        ),
      },
    };
  }

  async getGstr3b(args: { companyId: string; from?: string; to?: string }) {
    const gstr1 = await this.getGstr1(args);
    const outward = [...gstr1.b2b, ...gstr1.b2c];
    const totals = outward.reduce(
      (acc, row) => {
        acc.taxable_value += Number(row.taxable_value);
        acc.cgst_amount += Number(row.cgst_amount);
        acc.sgst_amount += Number(row.sgst_amount);
        acc.igst_amount += Number(row.igst_amount);
        acc.cess_amount += Number(row.cess_amount);
        return acc;
      },
      {
        taxable_value: 0,
        cgst_amount: 0,
        sgst_amount: 0,
        igst_amount: 0,
        cess_amount: 0,
      },
    );

    const credits = gstr1.cdnr.reduce(
      (acc, row) => {
        acc.total += Number(row.total);
        for (const item of row.items) {
          acc.taxable_value += Number(item.taxable_value);
          acc.cgst_amount += Number(item.cgst_amount);
          acc.sgst_amount += Number(item.sgst_amount);
          acc.igst_amount += Number(item.igst_amount);
          acc.cess_amount += Number(item.cess_amount);
        }
        return acc;
      },
      {
        total: 0,
        taxable_value: 0,
        cgst_amount: 0,
        sgst_amount: 0,
        igst_amount: 0,
        cess_amount: 0,
      },
    );

    return {
      company: gstr1.company,
      period: gstr1.period,
      outward_taxable_supplies: totals,
      credit_note_adjustments: credits,
      net_outward_supplies: {
        taxable_value: totals.taxable_value - credits.taxable_value,
        cgst_amount: totals.cgst_amount - credits.cgst_amount,
        sgst_amount: totals.sgst_amount - credits.sgst_amount,
        igst_amount: totals.igst_amount - credits.igst_amount,
        cess_amount: totals.cess_amount - credits.cess_amount,
      },
      exempt_nil_non_gst: {
        taxable_value: outward
          .flatMap((row) => row.items)
          .filter((item) => Number(item.rate) === 0)
          .reduce((sum, item) => sum + Number(item.taxable_value), 0),
      },
      warnings: gstr1.warnings,
    };
  }

  async getHsnSummary(args: { companyId: string; from?: string; to?: string }) {
    const gstr1 = await this.getGstr1(args);
    return {
      company: gstr1.company,
      period: gstr1.period,
      rows: gstr1.hsn_summary,
      warnings: gstr1.warnings,
    };
  }

  async getItcReport(args: { companyId: string; from?: string; to?: string }) {
    const company = await this.prisma.company.findUnique({
      where: { id: args.companyId },
      select: { name: true, gstin: true, stateCode: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    const purchases = await this.prisma.purchase.findMany({
      where: {
        companyId: args.companyId,
        status: { in: ['received', 'returned_partial', 'returned'] },
        ...this.getPeriodWhere(args, 'purchaseDate'),
      },
      include: this.itcPurchaseInclude,
      orderBy: { purchaseDate: 'asc' },
    });

    const eligible_rows: any[] = [];
    const warnings: string[] = [];
    const totals = {
      taxable_value: 0,
      cgst_amount: 0,
      sgst_amount: 0,
      igst_amount: 0,
      cess_amount: 0,
    };

    for (const purchase of purchases) {
      const posStateCode =
        purchase.placeOfSupplyStateCode ??
        this.deriveSupplierPosState(purchase.supplier);

      const items = purchase.items.map((item) =>
        this.inferItemTaxSplit({
          companyStateCode: company.stateCode,
          posStateCode,
          lineSubTotal: item.lineSubTotal,
          taxRate: item.taxRate,
          taxableValue: item.taxableValue,
          cgstAmount: item.cgstAmount,
          sgstAmount: item.sgstAmount,
          igstAmount: item.igstAmount,
          cessAmount: item.cessAmount,
        }),
      );

      const returns = purchase.purchaseReturns.flatMap((purchaseReturn) =>
        purchaseReturn.items.map((item) =>
          this.inferItemTaxSplit({
            companyStateCode: company.stateCode,
            posStateCode,
            lineSubTotal: item.lineSubTotal,
            taxRate: item.taxRate,
            taxableValue: item.taxableValue,
            cgstAmount: item.cgstAmount,
            sgstAmount: item.sgstAmount,
            igstAmount: item.igstAmount,
            cessAmount: item.cessAmount,
          }),
        ),
      );

      const row = {
        purchase_id: purchase.id,
        supplier_name: purchase.supplier.name,
        supplier_gstin: purchase.supplierGstin ?? purchase.supplier.gstin ?? '',
        purchase_date: purchase.purchaseDate?.toISOString().slice(0, 10) ?? '',
        taxable_value:
          items.reduce((sum, item) => sum + Number(item.taxableValue), 0) -
          returns.reduce((sum, item) => sum + Number(item.taxableValue), 0),
        cgst_amount:
          items.reduce((sum, item) => sum + Number(item.cgstAmount), 0) -
          returns.reduce((sum, item) => sum + Number(item.cgstAmount), 0),
        sgst_amount:
          items.reduce((sum, item) => sum + Number(item.sgstAmount), 0) -
          returns.reduce((sum, item) => sum + Number(item.sgstAmount), 0),
        igst_amount:
          items.reduce((sum, item) => sum + Number(item.igstAmount), 0) -
          returns.reduce((sum, item) => sum + Number(item.igstAmount), 0),
        cess_amount:
          items.reduce((sum, item) => sum + Number(item.cessAmount), 0) -
          returns.reduce((sum, item) => sum + Number(item.cessAmount), 0),
      };

      if (!row.supplier_gstin) {
        warnings.push(`Purchase ${purchase.id} is missing supplier GSTIN for ITC classification`);
      }

      totals.taxable_value += row.taxable_value;
      totals.cgst_amount += row.cgst_amount;
      totals.sgst_amount += row.sgst_amount;
      totals.igst_amount += row.igst_amount;
      totals.cess_amount += row.cess_amount;
      eligible_rows.push(row);
    }

    return {
      company,
      period: { from: args.from ?? null, to: args.to ?? null },
      eligible_itc: totals,
      rows: eligible_rows,
      warnings,
    };
  }

  async getReport(args: {
    companyId: string;
    report: GstReportType;
    from?: string;
    to?: string;
  }) {
    switch (args.report) {
      case 'gstr1':
        return this.getGstr1(args);
      case 'gstr3b':
        return this.getGstr3b(args);
      case 'hsn':
        return this.getHsnSummary(args);
      case 'itc':
        return this.getItcReport(args);
      default:
        throw new BadRequestException('Unsupported GST report');
    }
  }

  async createExport(args: {
    companyId: string;
    report: GstReportType;
    format?: GstExportFormat;
    from?: string;
    to?: string;
  }) {
    const format = args.format ?? 'json';
    const job = await this.prisma.exportJob.create({
      data: {
        companyId: args.companyId,
        type: `gst_${args.report}_${format}`,
        status: 'running',
        params: {
          report: args.report,
          format,
          from: args.from ?? null,
          to: args.to ?? null,
          schema_version: 'gst_v1',
          engine_version: 'gst_engine_v1',
        },
        startedAt: new Date(),
      },
    });

    try {
      const payload = await this.getReport({
        companyId: args.companyId,
        report: args.report,
        from: args.from,
        to: args.to,
      });

      fs.mkdirSync(this.getStorageDir(), { recursive: true });
      const extension =
        format === 'json' ? 'json' : format === 'excel' ? 'xls' : 'csv';
      const filename = `${args.report}_${job.id}.${extension}`;
      const filepath = path.join(this.getStorageDir(), filename);
      const content = this.serializeExport({
        report: args.report,
        format,
        payload,
      });
      fs.writeFileSync(filepath, content, 'utf8');

      const updated = await this.prisma.exportJob.update({
        where: { id: job.id },
        data: {
          status: 'succeeded',
          finishedAt: new Date(),
          resultFileUrl: `/api/companies/${args.companyId}/gst/exports/${job.id}/download`,
          resultFileName: filename,
          error: null,
          params: {
            ...(job.params as object),
            row_count: Array.isArray((payload as any).rows)
              ? (payload as any).rows.length
              : undefined,
          } as any,
        },
      });

      return { data: updated };
    } catch (error: any) {
      const updated = await this.prisma.exportJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          finishedAt: new Date(),
          error: String(error?.message ?? error),
        },
      });
      return { data: updated };
    }
  }

  async getExportJob(args: { companyId: string; jobId: string }) {
    const job = await this.prisma.exportJob.findFirst({
      where: { companyId: args.companyId, id: args.jobId },
    });
    if (!job) throw new NotFoundException('Export job not found');
    return { data: job };
  }

  getDownloadPath(args: { jobId: string; resultFileName?: string | null }) {
    if (args.resultFileName) {
      return path.join(this.getStorageDir(), args.resultFileName);
    }
    const files = fs.existsSync(this.getStorageDir())
      ? fs.readdirSync(this.getStorageDir())
      : [];
    const match = files.find((file) => file.includes(args.jobId));
    if (!match) {
      throw new NotFoundException('Export file missing');
    }
    return path.join(this.getStorageDir(), match);
  }

  private serializeExport(args: {
    report: GstReportType;
    format: GstExportFormat;
    payload: any;
  }) {
    if (args.format === 'json') {
      return JSON.stringify(args.payload, null, 2);
    }

    const rows = this.flattenForTabular(args.report, args.payload);
    if (args.format === 'csv') {
      return toCsv(rows);
    }

    return this.toSpreadsheetXml(rows);
  }

  private flattenForTabular(report: GstReportType, payload: any) {
    if (report === 'gstr1') {
      return [
        ...payload.b2b.map((row: any) => ({
          section: 'b2b',
          invoice_number: row.invoice_number,
          invoice_date: row.invoice_date,
          customer_name: row.customer_name,
          customer_gstin: row.customer_gstin,
          pos_state_code: row.pos_state_code,
          taxable_value: row.taxable_value,
          cgst_amount: row.cgst_amount,
          sgst_amount: row.sgst_amount,
          igst_amount: row.igst_amount,
          invoice_value: row.invoice_value,
        })),
        ...payload.b2c.map((row: any) => ({
          section: 'b2c',
          invoice_number: row.invoice_number,
          invoice_date: row.invoice_date,
          customer_name: row.customer_name,
          customer_gstin: row.customer_gstin,
          pos_state_code: row.pos_state_code,
          taxable_value: row.taxable_value,
          cgst_amount: row.cgst_amount,
          sgst_amount: row.sgst_amount,
          igst_amount: row.igst_amount,
          invoice_value: row.invoice_value,
        })),
        ...payload.cdnr.map((row: any) => ({
          section: 'cdnr',
          note_number: row.note_number,
          note_date: row.note_date,
          invoice_number: row.invoice_number,
          customer_gstin: row.customer_gstin,
          total: row.total,
          kind: row.kind,
        })),
      ];
    }

    if (report === 'gstr3b') {
      return [
        {
          bucket: 'outward_taxable_supplies',
          ...payload.outward_taxable_supplies,
        },
        {
          bucket: 'credit_note_adjustments',
          ...payload.credit_note_adjustments,
        },
        {
          bucket: 'net_outward_supplies',
          ...payload.net_outward_supplies,
        },
      ];
    }

    if (report === 'hsn') {
      return payload.rows;
    }

    return payload.rows;
  }

  private toSpreadsheetXml(rows: Array<Record<string, unknown>>) {
    const headers = Array.from(
      new Set(rows.flatMap((row) => Object.keys(row))),
    );
    const escape = (value: unknown) =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const headerXml = headers
      .map(
        (header) =>
          `<Cell><Data ss:Type="String">${escape(header)}</Data></Cell>`,
      )
      .join('');

    const rowXml = rows
      .map((row) => {
        const cells = headers
          .map((header) => {
            const value = row[header];
            const type =
              typeof value === 'number' ? 'Number' : 'String';
            return `<Cell><Data ss:Type="${type}">${escape(value ?? '')}</Data></Cell>`;
          })
          .join('');
        return `<Row>${cells}</Row>`;
      })
      .join('');

    return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="GST">
  <Table>
   <Row>${headerXml}</Row>
   ${rowXml}
  </Table>
 </Worksheet>
</Workbook>`;
  }
}
