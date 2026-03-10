import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { CompanyAdminGuard } from '../common/auth/company-admin.guard';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { PrismaService } from '../prisma/prisma.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { PatchUserDto } from './dto/patch-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('/api/companies/:companyId/users')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard, CompanyAdminGuard)
export class CompaniesUsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Param('companyId') companyId: string) {
    const rows = await this.prisma.user.findMany({
      where: { companyId },
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
    });
    return { ok: true, data: rows };
  }

  @Post()
  async invite(
    @Param('companyId') companyId: string,
    @Body() dto: InviteUserDto,
  ) {
    // MVP/dev-mode: create a user with a generated password and return it.
    // TODO: replace with email invite token flow.
    const { default: bcrypt } = await import('bcryptjs');

    const tempPassword =
      dto.temp_password ?? Math.random().toString(36).slice(2) + 'A1!';
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const created = await this.prisma.user.create({
      data: {
        companyId,
        email: dto.email,
        name: dto.name ?? null,
        role: dto.role ?? 'staff',
        isActive: dto.is_active ?? true,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return {
      ok: true,
      data: {
        user: created,
        dev: {
          temporary_password: tempPassword,
        },
      },
    };
  }

  @Patch('/:userId')
  async patch(
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
    @Body() dto: PatchUserDto,
  ) {
    // Ensure user belongs to company
    const exists = await this.prisma.user.findFirst({
      where: { id: userId, companyId },
      select: { id: true },
    });
    if (!exists)
      return { ok: false, error: { code: 'NOT_FOUND', message: 'User not found' } };

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: dto.role ?? undefined,
        isActive: dto.is_active ?? undefined,
        name: dto.name ?? undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    return { ok: true, data: updated };
  }
}
