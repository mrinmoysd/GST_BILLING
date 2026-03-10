import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('/api/companies/:companyId/categories')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard)
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  async list(@Param('companyId') companyId: string) {
    const data = await this.categories.list(companyId);
    return { ok: true, data };
  }

  @Post()
  async create(
    @Param('companyId') companyId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    const data = await this.categories.create(companyId, dto);
    return { ok: true, data };
  }

  @Patch('/:categoryId')
  async update(
    @Param('companyId') companyId: string,
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const data = await this.categories.update(companyId, categoryId, dto);
    return { ok: true, data };
  }

  @Delete('/:categoryId')
  async remove(
    @Param('companyId') companyId: string,
    @Param('categoryId') categoryId: string,
  ) {
    const data = await this.categories.remove(companyId, categoryId);
    return { ok: true, data };
  }
}
