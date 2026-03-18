import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { BootstrapOnboardingDto } from './dto/bootstrap-onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  async bootstrap(dto: BootstrapOnboardingDto) {
    const email = dto.email.trim().toLowerCase();
    const companyName = dto.company_name.trim();
    const ownerName = dto.owner_name.trim();

    const existing = await this.prisma.user.findFirst({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const company = await this.prisma.$transaction(async (tx) => {
      const createdCompany = await tx.company.create({
        data: {
          name: companyName,
          gstin: dto.gstin?.trim() || null,
          pan: dto.pan?.trim() || null,
          businessType: dto.business_type?.trim() || 'trader',
          state: dto.state?.trim() || null,
          stateCode: dto.state_code?.trim() || null,
          timezone: dto.timezone?.trim() || 'Asia/Kolkata',
          logoUrl: dto.logo_url?.trim() || null,
          allowNegativeStock: Boolean(dto.allow_negative_stock),
          invoiceSettings: {
            onboarding_completed: true,
            default_series_code: 'DEFAULT',
            default_prefix: dto.invoice_prefix?.trim() || 'INV-',
          },
        },
      });

      await tx.invoiceSeries.create({
        data: {
          companyId: createdCompany.id,
          code: 'DEFAULT',
          prefix: dto.invoice_prefix?.trim() || 'INV-',
          nextNumber: 1,
          isActive: true,
        },
      });

      const user = await tx.user.create({
        data: {
          companyId: createdCompany.id,
          email,
          name: ownerName,
          role: 'owner',
          isActive: true,
          passwordHash,
        },
      });

      return {
        id: createdCompany.id,
        name: createdCompany.name,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
      };
    });

    const accessToken = await this.auth.signAccessToken({
      sub: company.userId,
      companyId: company.id,
    });

    const refreshToken = await this.auth.signRefreshToken({
      sub: company.userId,
      companyId: company.id,
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const refreshTtl = this.config.get<number>(
      'JWT_REFRESH_TTL_SECONDS',
      60 * 60 * 24 * 30,
    );

    await this.prisma.session.create({
      data: {
        userId: company.userId,
        companyId: company.id,
        refreshTokenHash,
        expiresAt: new Date(Date.now() + refreshTtl * 1000),
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: company.userId,
        email: company.userEmail,
        name: company.userName,
        role: company.userRole,
        company_id: company.id,
      },
      company: {
        id: company.id,
        name: company.name,
      },
      onboarding: {
        completed: true,
        gstin_verification_status: dto.gstin ? 'pending' : 'not_started',
      },
    };
  }
}
