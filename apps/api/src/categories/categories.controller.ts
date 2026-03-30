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
import { PermissionGuard } from '../common/auth/permission.guard';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('/api/companies/:companyId/categories')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard, PermissionGuard)
@RequirePermissions('masters.view')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  async list(@Param('companyId') companyId: string) {
    const data = await this.categories.list(companyId);
    return { ok: true, data };
  }

  @Post()
  @RequirePermissions('masters.manage')
  async create(
    @Param('companyId') companyId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    const data = await this.categories.create(companyId, dto);
    return { ok: true, data };
  }

  @Patch('/:categoryId')
  @RequirePermissions('masters.manage')
  async update(
    @Param('companyId') companyId: string,
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const data = await this.categories.update(companyId, categoryId, dto);
    return { ok: true, data };
  }

  @Delete('/:categoryId')
  @RequirePermissions('masters.manage')
  async remove(
    @Param('companyId') companyId: string,
    @Param('categoryId') categoryId: string,
  ) {
    const data = await this.categories.remove(companyId, categoryId);
    return { ok: true, data };
  }
}
