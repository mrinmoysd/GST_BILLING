import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly d = Decimal;

  async list(companyId: string, page = 1, limit = 20, q?: string) {
    const skip = (page - 1) * limit;

    const where: any = { companyId, deletedAt: null };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { hsn: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async create(companyId: string, dto: CreateProductDto) {
    if (dto.categoryId) {
      const cat = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, companyId },
        select: { id: true },
      });
      if (!cat) throw new BadRequestException('Invalid categoryId');
    }

    const data = {
        companyId,
        name: dto.name,
        sku: dto.sku ?? null,
        hsn: dto.hsn ?? null,
        categoryId: dto.categoryId ?? null,
        price:
          dto.price !== undefined && dto.price !== null
            ? new this.d(dto.price as any)
            : new this.d(0),
        costPrice:
          dto.costPrice !== undefined && dto.costPrice !== null
            ? new this.d(dto.costPrice as any)
            : new this.d(0),
        taxRate:
          dto.gstRate !== undefined && dto.gstRate !== null
            ? new this.d(dto.gstRate as any)
            : null,
        stock: new this.d(0),
        metadata: dto.meta ? (dto.meta as any) : (Prisma as any).JsonNull,
      } satisfies Prisma.ProductUncheckedCreateInput;

    return this.prisma.product.create({
      data,
    });
  }

  async get(companyId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId, deletedAt: null },
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(companyId: string, productId: string, dto: UpdateProductDto) {
    await this.get(companyId, productId);

    if (dto.categoryId !== undefined && dto.categoryId !== null) {
      const cat = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, companyId },
        select: { id: true },
      });
      if (!cat) throw new BadRequestException('Invalid categoryId');
    }

    const data: any = {
      name: dto.name,
      sku: dto.sku,
      hsn: dto.hsn,
  categoryId: dto.categoryId,
      taxRate:
        dto.gstRate === undefined
          ? undefined
          : dto.gstRate === null
            ? null
            : new this.d(dto.gstRate as any),
      metadata: dto.meta ? (dto.meta as any) : undefined,
    };

    if (dto.price !== undefined) {
      data.price = dto.price === null ? null : new this.d(dto.price as any);
    }

    if (dto.costPrice !== undefined) {
      data.costPrice =
        dto.costPrice === null ? null : new this.d(dto.costPrice as any);
    }

    return this.prisma.product.update({
      where: { id: productId },
      data,
    });
  }

  async remove(companyId: string, productId: string) {
    await this.get(companyId, productId);
    return this.prisma.product.update({
      where: { id: productId },
      data: { deletedAt: new Date() },
    });
  }

  // Stock changes are handled by InventoryService (writes StockMovement + enforces policy).
}
