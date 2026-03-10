import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(companyId: string) {
    const items = await this.prisma.category.findMany({
      where: { companyId },
      orderBy: [{ name: 'asc' }],
    });

    return items.map(
      (c: {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
      }) => ({
  id: c.id,
  name: c.name,
  is_active: c.isActive,
  created_at: c.createdAt.toISOString(),
  updated_at: c.updatedAt.toISOString(),
      }),
    );
  }

  async create(companyId: string, dto: CreateCategoryDto) {
    const created = await this.prisma.category.create({
      data: {
        companyId,
        name: dto.name.trim(),
        isActive: dto.is_active ?? true,
      },
    });

    return {
      id: created.id,
      name: created.name,
      is_active: created.isActive,
      created_at: created.createdAt.toISOString(),
      updated_at: created.updatedAt.toISOString(),
    };
  }

  async update(companyId: string, categoryId: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: { id: categoryId, companyId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Category not found');

    const updated = await this.prisma.category.update({
      where: { id: categoryId },
      data: {
        name: dto.name ? dto.name.trim() : undefined,
        isActive: dto.is_active,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      is_active: updated.isActive,
      created_at: updated.createdAt.toISOString(),
      updated_at: updated.updatedAt.toISOString(),
    };
  }

  async remove(companyId: string, categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, companyId },
      select: { id: true },
    });
    if (!category) throw new NotFoundException('Category not found');

    const usedBy = await this.prisma.product.count({
      where: { companyId, categoryId, deletedAt: null },
    });
    if (usedBy > 0) {
      throw new ConflictException('Category is used by products');
    }

    await this.prisma.category.delete({ where: { id: categoryId } });
    return { id: categoryId };
  }
}
