import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCommercialSchemeDto } from './dto/create-commercial-scheme.dto';
import { CreateCustomerProductPriceDto } from './dto/create-customer-product-price.dto';
import { CreatePriceListDto } from './dto/create-price-list.dto';

type DbClient = Prisma.TransactionClient | PrismaService;
type GuardrailMode = 'warn' | 'block';

type CommercialPolicy = {
  maxLineDiscountPercent: Decimal | null;
  minMarginPercent: Decimal | null;
  discountMode: GuardrailMode;
  marginMode: GuardrailMode;
};

type AppliedSchemeSummary = {
  id: string;
  code: string;
  name: string;
  scheme_type: string;
  discount_amount: string;
  free_quantity: string;
  is_exclusive: boolean;
};

function toDecimal(value: string | undefined, fallback = '0'): Decimal {
  const v = (value ?? fallback).trim();
  return new Decimal(v);
}

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  private parsePolicyDecimal(value: unknown) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return new Decimal(value);
    }
    if (typeof value === 'string' && value.trim()) {
      return new Decimal(value.trim());
    }
    return null;
  }

  private parseGuardrailMode(value: unknown): GuardrailMode {
    return value === 'block' ? 'block' : 'warn';
  }

  private assertCommercialRuleHasOutcome(args: {
    fixedPrice?: string;
    discountPercent?: string;
  }) {
    if (!args.fixedPrice && !args.discountPercent) {
      throw new BadRequestException(
        'Provide fixed_price or discount_percent',
      );
    }
  }

  private computeResolvedUnitPrice(args: {
    basePrice: Decimal;
    fixedPrice?: Decimal | null;
    discountPercent?: Decimal | null;
  }) {
    if (args.fixedPrice !== undefined && args.fixedPrice !== null) {
      if (args.fixedPrice.lt(0)) {
        throw new BadRequestException('fixed_price must be >= 0');
      }
      return args.fixedPrice;
    }

    const percent = args.discountPercent ?? new Decimal(0);
    if (percent.lt(0)) {
      throw new BadRequestException('discount_percent must be >= 0');
    }
    if (percent.gt(100)) {
      throw new BadRequestException('discount_percent must be <= 100');
    }

    const factor = new Decimal(1).sub(percent.div(100));
    return args.basePrice.mul(factor);
  }

  private async getCustomer(args: {
    db: DbClient;
    companyId: string;
    customerId: string;
  }) {
    const customer = await args.db.customer.findFirst({
      where: {
        id: args.customerId,
        companyId: args.companyId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        pricingTier: true,
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  private async getProduct(args: {
    db: DbClient;
    companyId: string;
    productId: string;
  }) {
    const product = await args.db.product.findFirst({
      where: {
        id: args.productId,
        companyId: args.companyId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        price: true,
        taxRate: true,
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  private isRuleActive(
    date: Date,
    startsAt?: Date | null,
    endsAt?: Date | null,
  ) {
    const current = date.toISOString().slice(0, 10);
    const start = startsAt ? startsAt.toISOString().slice(0, 10) : null;
    const end = endsAt ? endsAt.toISOString().slice(0, 10) : null;
    if (start && current < start) return false;
    if (end && current > end) return false;
    return true;
  }

  private assertSchemeHasOutcome(dto: CreateCommercialSchemeDto) {
    if (
      !dto.percent_discount &&
      !dto.flat_discount_amount &&
      !dto.free_quantity
    ) {
      throw new BadRequestException(
        'Provide percent_discount, flat_discount_amount, or free_quantity',
      );
    }
  }

  async getCommercialPolicy(args: { companyId: string; tx?: DbClient }) {
    const db = args.tx ?? this.prisma;
    const company = await db.company.findUnique({
      where: { id: args.companyId },
      select: { invoiceSettings: true },
    });

    const rawSettings =
      company?.invoiceSettings && typeof company.invoiceSettings === 'object'
        ? (company.invoiceSettings as Record<string, unknown>)
        : {};
    const rawPolicy =
      rawSettings.commercial_policy &&
      typeof rawSettings.commercial_policy === 'object'
        ? (rawSettings.commercial_policy as Record<string, unknown>)
        : {};

    return {
      maxLineDiscountPercent: this.parsePolicyDecimal(
        rawPolicy.max_line_discount_percent,
      ),
      minMarginPercent: this.parsePolicyDecimal(rawPolicy.min_margin_percent),
      discountMode: this.parseGuardrailMode(rawPolicy.discount_guardrail_mode),
      marginMode: this.parseGuardrailMode(rawPolicy.margin_guardrail_mode),
    } satisfies CommercialPolicy;
  }

  async evaluateCommercialGuardrails(args: {
    companyId: string;
    quantity: Decimal;
    resolvedUnitPrice: Decimal;
    enteredUnitPrice: Decimal;
    resolvedDiscount?: Decimal;
    enteredDiscount: Decimal;
    costPrice?: Decimal | null;
    overrideReason?: string | null;
    tx?: DbClient;
  }) {
    const policy = await this.getCommercialPolicy({
      companyId: args.companyId,
      tx: args.tx,
    });
    const resolvedGross = args.resolvedUnitPrice.mul(args.quantity);
    const enteredNet = args.enteredUnitPrice
      .mul(args.quantity)
      .sub(args.enteredDiscount);
    const effectiveDiscountPercent = resolvedGross.lte(0)
      ? new Decimal(0)
      : Decimal.max(
          new Decimal(0),
          resolvedGross.sub(enteredNet).div(resolvedGross).mul(100),
        );
    const costBasis = new Decimal(args.costPrice ?? 0).mul(args.quantity);
    const marginPercent = enteredNet.lte(0)
      ? null
      : enteredNet.sub(costBasis).div(enteredNet).mul(100);
    const resolvedDiscount = args.resolvedDiscount ?? new Decimal(0);
    const hasCommercialOverride =
      !args.enteredUnitPrice.equals(args.resolvedUnitPrice) ||
      !args.enteredDiscount.equals(resolvedDiscount);
    const normalizedReason = args.overrideReason?.trim() || null;

    if (hasCommercialOverride && !normalizedReason) {
      throw new BadRequestException(
        'override_reason is required for manual discount or rate override',
      );
    }

    const warnings: string[] = [];
    const blocks: string[] = [];

    if (
      policy.maxLineDiscountPercent &&
      effectiveDiscountPercent.gt(policy.maxLineDiscountPercent)
    ) {
      const message = `Effective discount ${effectiveDiscountPercent.toFixed(2)}% exceeds allowed ${policy.maxLineDiscountPercent.toFixed(2)}%`;
      if (policy.discountMode === 'block') {
        blocks.push(message);
      } else {
        warnings.push(message);
      }
    }

    if (
      policy.minMarginPercent &&
      marginPercent !== null &&
      marginPercent.lt(policy.minMarginPercent)
    ) {
      const message = `Margin ${marginPercent.toFixed(2)}% is below allowed ${policy.minMarginPercent.toFixed(2)}%`;
      if (policy.marginMode === 'block') {
        blocks.push(message);
      } else {
        warnings.push(message);
      }
    }

    if (blocks.length > 0) {
      throw new BadRequestException(blocks.join('; '));
    }

    return {
      policy: {
        max_line_discount_percent:
          policy.maxLineDiscountPercent?.toString() ?? null,
        min_margin_percent: policy.minMarginPercent?.toString() ?? null,
        discount_guardrail_mode: policy.discountMode,
        margin_guardrail_mode: policy.marginMode,
      },
      effectiveDiscountPercent,
      marginPercent,
      warnings,
      overrideReason: normalizedReason,
      hasCommercialOverride,
    };
  }

  async listSchemes(companyId: string) {
    const data = await this.prisma.commercialScheme.findMany({
      where: { companyId },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        customer: { select: { id: true, name: true, pricingTier: true } },
        product: { select: { id: true, name: true, sku: true, price: true } },
      },
    });
    return { data };
  }

  async createScheme(args: { companyId: string; dto: CreateCommercialSchemeDto }) {
    this.assertSchemeHasOutcome(args.dto);

    if (args.dto.customer_id) {
      await this.getCustomer({
        db: this.prisma,
        companyId: args.companyId,
        customerId: args.dto.customer_id,
      });
    }
    if (args.dto.product_id) {
      await this.getProduct({
        db: this.prisma,
        companyId: args.companyId,
        productId: args.dto.product_id,
      });
    }

    const data = await this.prisma.commercialScheme.create({
      data: {
        companyId: args.companyId,
        code: args.dto.code.trim(),
        name: args.dto.name.trim(),
        schemeType: args.dto.scheme_type.trim(),
        documentType: args.dto.document_type?.trim() || null,
        customerId: args.dto.customer_id ?? null,
        pricingTier: args.dto.pricing_tier?.trim() || null,
        productId: args.dto.product_id ?? null,
        minQuantity: args.dto.min_quantity
          ? toDecimal(args.dto.min_quantity)
          : null,
        minAmount: args.dto.min_amount ? toDecimal(args.dto.min_amount) : null,
        percentDiscount: args.dto.percent_discount
          ? toDecimal(args.dto.percent_discount)
          : null,
        flatDiscountAmount: args.dto.flat_discount_amount
          ? toDecimal(args.dto.flat_discount_amount)
          : null,
        freeQuantity: args.dto.free_quantity
          ? toDecimal(args.dto.free_quantity)
          : null,
        priority: args.dto.priority ?? 0,
        isExclusive: args.dto.is_exclusive ?? false,
        isActive: args.dto.is_active ?? true,
        startsAt: args.dto.starts_at ? new Date(args.dto.starts_at) : null,
        endsAt: args.dto.ends_at ? new Date(args.dto.ends_at) : null,
      },
      include: {
        customer: { select: { id: true, name: true, pricingTier: true } },
        product: { select: { id: true, name: true, sku: true, price: true } },
      },
    });

    return { data };
  }

  async listCommercialAuditLogs(args: {
    companyId: string;
    limit?: number;
    action?: string;
  }) {
    const data = await this.prisma.commercialAuditLog.findMany({
      where: {
        companyId: args.companyId,
        ...(args.action ? { action: args.action } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: args.limit ?? 100,
      include: {
        actor: { select: { id: true, name: true, email: true } },
        customer: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, sku: true } },
      },
    });
    return { data };
  }

  async listPriceLists(companyId: string) {
    const data = await this.prisma.priceList.findMany({
      where: { companyId },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, price: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    return { data };
  }

  async createPriceList(args: { companyId: string; dto: CreatePriceListDto }) {
    if (!args.dto.items?.length) {
      throw new BadRequestException('Price list must include at least one item');
    }
    for (const item of args.dto.items) {
      this.assertCommercialRuleHasOutcome({
        fixedPrice: item.fixed_price,
        discountPercent: item.discount_percent,
      });
    }

    const productIds = [...new Set(args.dto.items.map((item) => item.product_id))];
    const products = await this.prisma.product.findMany({
      where: {
        companyId: args.companyId,
        id: { in: productIds },
        deletedAt: null,
      },
      select: { id: true },
    });
    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found');
    }

    const created = await this.prisma.priceList.create({
      data: {
        companyId: args.companyId,
        code: args.dto.code.trim(),
        name: args.dto.name.trim(),
        pricingTier: args.dto.pricing_tier?.trim() || null,
        priority: args.dto.priority ?? 0,
        isActive: args.dto.is_active ?? true,
        startsAt: args.dto.starts_at ? new Date(args.dto.starts_at) : null,
        endsAt: args.dto.ends_at ? new Date(args.dto.ends_at) : null,
        items: {
          create: args.dto.items.map((item) => ({
            companyId: args.companyId,
            productId: item.product_id,
            fixedPrice: item.fixed_price
              ? toDecimal(item.fixed_price)
              : undefined,
            discountPercent: item.discount_percent
              ? toDecimal(item.discount_percent)
              : undefined,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, price: true },
            },
          },
        },
      },
    });

    return { data: created };
  }

  async listCustomerProductPrices(companyId: string) {
    const data = await this.prisma.customerProductPrice.findMany({
      where: { companyId },
      orderBy: [{ updatedAt: 'desc' }],
      include: {
        customer: { select: { id: true, name: true, pricingTier: true } },
        product: { select: { id: true, name: true, sku: true, price: true } },
      },
    });
    return { data };
  }

  async createCustomerProductPrice(args: {
    companyId: string;
    dto: CreateCustomerProductPriceDto;
  }) {
    this.assertCommercialRuleHasOutcome({
      fixedPrice: args.dto.fixed_price,
      discountPercent: args.dto.discount_percent,
    });
    await this.getCustomer({
      db: this.prisma,
      companyId: args.companyId,
      customerId: args.dto.customer_id,
    });
    await this.getProduct({
      db: this.prisma,
      companyId: args.companyId,
      productId: args.dto.product_id,
    });

    const data = await this.prisma.customerProductPrice.upsert({
      where: {
        companyId_customerId_productId: {
          companyId: args.companyId,
          customerId: args.dto.customer_id,
          productId: args.dto.product_id,
        },
      },
      create: {
        companyId: args.companyId,
        customerId: args.dto.customer_id,
        productId: args.dto.product_id,
        fixedPrice: args.dto.fixed_price
          ? toDecimal(args.dto.fixed_price)
          : undefined,
        discountPercent: args.dto.discount_percent
          ? toDecimal(args.dto.discount_percent)
          : undefined,
        isActive: args.dto.is_active ?? true,
        startsAt: args.dto.starts_at ? new Date(args.dto.starts_at) : null,
        endsAt: args.dto.ends_at ? new Date(args.dto.ends_at) : null,
      },
      update: {
        fixedPrice: args.dto.fixed_price
          ? toDecimal(args.dto.fixed_price)
          : null,
        discountPercent: args.dto.discount_percent
          ? toDecimal(args.dto.discount_percent)
          : null,
        isActive: args.dto.is_active ?? true,
        startsAt: args.dto.starts_at ? new Date(args.dto.starts_at) : null,
        endsAt: args.dto.ends_at ? new Date(args.dto.ends_at) : null,
      },
      include: {
        customer: { select: { id: true, name: true, pricingTier: true } },
        product: { select: { id: true, name: true, sku: true, price: true } },
      },
    });

    return { data };
  }

  async evaluateSchemes(args: {
    companyId: string;
    customerId: string;
    productId: string;
    quantity: Decimal;
    resolvedUnitPrice: Decimal;
    documentDate?: Date;
    documentType?: string;
    tx?: DbClient;
  }) {
    const db = args.tx ?? this.prisma;
    const effectiveDate = args.documentDate ?? new Date();
    const customer = await this.getCustomer({
      db,
      companyId: args.companyId,
      customerId: args.customerId,
    });
    await this.getProduct({
      db,
      companyId: args.companyId,
      productId: args.productId,
    });

    const grossAmount = args.resolvedUnitPrice.mul(args.quantity);
    const schemes = await db.commercialScheme.findMany({
      where: {
        companyId: args.companyId,
        isActive: true,
        AND: [
          {
            OR: [{ customerId: customer.id }, { customerId: null }],
          },
          {
            OR: [
              { pricingTier: customer.pricingTier ?? '__no_match__' },
              { pricingTier: null },
            ],
          },
          {
            OR: [{ productId: args.productId }, { productId: null }],
          },
          {
            OR: [{ documentType: args.documentType ?? '__no_match__' }, { documentType: null }],
          },
        ],
      },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
    });

    const eligible = schemes
      .filter((scheme) =>
        this.isRuleActive(effectiveDate, scheme.startsAt, scheme.endsAt),
      )
      .filter((scheme) =>
        !scheme.minQuantity || args.quantity.gte(scheme.minQuantity),
      )
      .filter((scheme) => !scheme.minAmount || grossAmount.gte(scheme.minAmount))
      .map((scheme) => {
        let discountAmount = new Decimal(0);
        let freeQuantity = new Decimal(0);

        if (scheme.percentDiscount) {
          discountAmount = discountAmount.add(
            grossAmount.mul(scheme.percentDiscount).div(100),
          );
        }
        if (scheme.flatDiscountAmount) {
          discountAmount = discountAmount.add(scheme.flatDiscountAmount);
        }
        if (scheme.freeQuantity) {
          freeQuantity = freeQuantity.add(scheme.freeQuantity);
        }

        return {
          scheme,
          discountAmount,
          freeQuantity,
        };
      });

    const exclusive = eligible.filter((entry) => entry.scheme.isExclusive);
    const selected =
      exclusive.length > 0
        ? [exclusive[0]!]
        : eligible.filter((entry) => !entry.scheme.isExclusive);

    const discountAmount = Decimal.min(
      grossAmount,
      selected.reduce(
        (acc, entry) => acc.add(entry.discountAmount),
        new Decimal(0),
      ),
    );
    const freeQuantity = selected.reduce(
      (acc, entry) => acc.add(entry.freeQuantity),
      new Decimal(0),
    );
    const appliedSchemes: AppliedSchemeSummary[] = selected.map((entry) => ({
      id: entry.scheme.id,
      code: entry.scheme.code,
      name: entry.scheme.name,
      scheme_type: entry.scheme.schemeType,
      discount_amount: entry.discountAmount.toString(),
      free_quantity: entry.freeQuantity.toString(),
      is_exclusive: entry.scheme.isExclusive,
    }));

    return {
      discountAmount,
      freeQuantity,
      appliedSchemes,
    };
  }

  async resolveCommercialLine(args: {
    companyId: string;
    customerId: string;
    productId: string;
    quantity: Decimal;
    documentDate?: Date;
    documentType?: string;
    tx?: DbClient;
  }) {
    const basePricing = await this.resolveLine(args);
    const schemes = await this.evaluateSchemes({
      companyId: args.companyId,
      customerId: args.customerId,
      productId: args.productId,
      quantity: args.quantity,
      resolvedUnitPrice: basePricing.resolvedUnitPrice,
      documentDate: args.documentDate,
      documentType: args.documentType,
      tx: args.tx,
    });

    return {
      ...basePricing,
      resolvedDiscount: schemes.discountAmount,
      freeQuantity: schemes.freeQuantity,
      appliedSchemes: schemes.appliedSchemes,
      snapshot: {
        ...basePricing.snapshot,
        resolved_discount: schemes.discountAmount.toString(),
        free_quantity: schemes.freeQuantity.toString(),
        applied_schemes: schemes.appliedSchemes,
      },
    };
  }

  async createCommercialAuditLogs(args: {
    companyId: string;
    actorUserId?: string | null;
    documentType: string;
    documentId: string;
    rows: Array<{
      documentLineId?: string | null;
      customerId?: string | null;
      productId?: string | null;
      pricingSource?: string | null;
      action: string;
      overrideReason?: string | null;
      warnings?: unknown;
      snapshot: Prisma.InputJsonValue;
    }>;
    tx?: DbClient;
  }) {
    if (!args.rows.length) return;
    const db = args.tx ?? this.prisma;
    await db.commercialAuditLog.createMany({
      data: args.rows.map((row) => ({
        companyId: args.companyId,
        actorUserId: args.actorUserId ?? null,
        documentType: args.documentType,
        documentId: args.documentId,
        documentLineId: row.documentLineId ?? null,
        customerId: row.customerId ?? null,
        productId: row.productId ?? null,
        pricingSource: row.pricingSource ?? null,
        action: row.action,
        overrideReason: row.overrideReason ?? null,
        warnings: (row.warnings ?? null) as Prisma.InputJsonValue,
        snapshot: row.snapshot,
      })),
    });
  }

  async resolveLine(args: {
    companyId: string;
    customerId: string;
    productId: string;
    quantity: Decimal;
    documentDate?: Date;
    documentType?: string;
    tx?: DbClient;
  }) {
    if (args.quantity.lte(0)) {
      throw new BadRequestException('quantity must be > 0');
    }

    const db = args.tx ?? this.prisma;
    const effectiveDate = args.documentDate ?? new Date();
    const customer = await this.getCustomer({
      db,
      companyId: args.companyId,
      customerId: args.customerId,
    });
    const product = await this.getProduct({
      db,
      companyId: args.companyId,
      productId: args.productId,
    });

    const baseProductPrice = new Decimal(product.price ?? 0);

    const special = await db.customerProductPrice.findFirst({
      where: {
        companyId: args.companyId,
        customerId: customer.id,
        productId: product.id,
        isActive: true,
      },
      orderBy: [{ updatedAt: 'desc' }],
    });

    if (
      special &&
      this.isRuleActive(effectiveDate, special.startsAt, special.endsAt)
    ) {
      const resolvedUnitPrice = this.computeResolvedUnitPrice({
        basePrice: baseProductPrice,
        fixedPrice: special.fixedPrice,
        discountPercent: special.discountPercent,
      });
      return {
        productId: product.id,
        productName: product.name,
        quantity: args.quantity,
        resolvedUnitPrice,
        baseProductPrice,
        source: 'customer_product_price',
        sourceId: special.id,
        sourceLabel: 'Customer special price',
        snapshot: {
          document_type: args.documentType ?? null,
          customer_id: customer.id,
          customer_name: customer.name,
          pricing_tier: customer.pricingTier ?? null,
          product_id: product.id,
          product_name: product.name,
          quantity: args.quantity.toString(),
          base_product_price: baseProductPrice.toString(),
          resolved_unit_price: resolvedUnitPrice.toString(),
          source: 'customer_product_price',
          source_id: special.id,
          fixed_price: special.fixedPrice?.toString() ?? null,
          discount_percent: special.discountPercent?.toString() ?? null,
        },
      };
    }

    const candidateLists = await db.priceList.findMany({
      where: {
        companyId: args.companyId,
        isActive: true,
        OR: [
          { pricingTier: customer.pricingTier ?? '__no_match__' },
          { pricingTier: null },
        ],
      },
      include: {
        items: {
          where: { productId: product.id },
          take: 1,
        },
      },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
    });

    const matchedList = candidateLists.find((list) => {
      if (!list.items.length) return false;
      return this.isRuleActive(effectiveDate, list.startsAt, list.endsAt);
    });

    if (matchedList) {
      const matchedItem = matchedList.items[0]!;
      const resolvedUnitPrice = this.computeResolvedUnitPrice({
        basePrice: baseProductPrice,
        fixedPrice: matchedItem.fixedPrice,
        discountPercent: matchedItem.discountPercent,
      });
      return {
        productId: product.id,
        productName: product.name,
        quantity: args.quantity,
        resolvedUnitPrice,
        baseProductPrice,
        source:
          matchedList.pricingTier && matchedList.pricingTier === customer.pricingTier
            ? 'pricing_tier_price_list'
            : 'global_price_list',
        sourceId: matchedList.id,
        sourceLabel: matchedList.name,
        snapshot: {
          document_type: args.documentType ?? null,
          customer_id: customer.id,
          customer_name: customer.name,
          pricing_tier: customer.pricingTier ?? null,
          product_id: product.id,
          product_name: product.name,
          quantity: args.quantity.toString(),
          base_product_price: baseProductPrice.toString(),
          resolved_unit_price: resolvedUnitPrice.toString(),
          source:
            matchedList.pricingTier &&
            matchedList.pricingTier === customer.pricingTier
              ? 'pricing_tier_price_list'
              : 'global_price_list',
          source_id: matchedList.id,
          source_code: matchedList.code,
          source_name: matchedList.name,
          fixed_price: matchedItem.fixedPrice?.toString() ?? null,
          discount_percent: matchedItem.discountPercent?.toString() ?? null,
        },
      };
    }

    return {
      productId: product.id,
      productName: product.name,
      quantity: args.quantity,
      resolvedUnitPrice: baseProductPrice,
      baseProductPrice,
      source: 'product_price',
      sourceId: product.id,
      sourceLabel: 'Product price',
      snapshot: {
        document_type: args.documentType ?? null,
        customer_id: customer.id,
        customer_name: customer.name,
        pricing_tier: customer.pricingTier ?? null,
        product_id: product.id,
        product_name: product.name,
        quantity: args.quantity.toString(),
        base_product_price: baseProductPrice.toString(),
        resolved_unit_price: baseProductPrice.toString(),
        source: 'product_price',
        source_id: product.id,
      },
    };
  }

  async preview(args: {
    companyId: string;
    customerId: string;
    items: Array<{ product_id: string; quantity: string }>;
    documentDate?: string;
    documentType?: string;
  }) {
    const previewDate = args.documentDate ? new Date(args.documentDate) : undefined;
    const data = [];
    for (const item of args.items) {
      const result = await this.resolveLine({
        companyId: args.companyId,
        customerId: args.customerId,
        productId: item.product_id,
        quantity: toDecimal(item.quantity),
        documentDate: previewDate,
        documentType: args.documentType,
      });
      const commercial = await this.resolveCommercialLine({
        companyId: args.companyId,
        customerId: args.customerId,
        productId: item.product_id,
        quantity: toDecimal(item.quantity),
        documentDate: previewDate,
        documentType: args.documentType,
      });
      data.push({
        product_id: item.product_id,
        quantity: item.quantity,
        resolved_unit_price: result.resolvedUnitPrice.toString(),
        resolved_discount: commercial.resolvedDiscount.toString(),
        free_quantity: commercial.freeQuantity.toString(),
        base_product_price: result.baseProductPrice.toString(),
        source: result.source,
        source_id: result.sourceId,
        source_label: result.sourceLabel,
        applied_schemes: commercial.appliedSchemes,
        snapshot: commercial.snapshot,
      });
    }
    return { data };
  }
}
