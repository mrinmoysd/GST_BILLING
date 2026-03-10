import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCompany(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async updateCompany(companyId: string, dto: UpdateCompanyDto) {
    // Ensure exists
    await this.getCompany(companyId);

    return this.prisma.company.update({
      where: { id: companyId },
      data: {
        name: dto.name,
        gstin: dto.gstin,
        pan: dto.pan,
        businessType: dto.business_type,
  address: dto.address ? (dto.address as any) : undefined,
        state: dto.state,
        stateCode: dto.state_code,
  contact: dto.contact ? (dto.contact as any) : undefined,
  bankDetails: dto.bank_details ? (dto.bank_details as any) : undefined,
        invoiceSettings: dto.invoice_settings
          ? (dto.invoice_settings as any)
          : undefined,
        allowNegativeStock: dto.allow_negative_stock,
        logoUrl: dto.logo_url,
        timezone: dto.timezone,
        updatedAt: new Date(),
      },
    });
  }
}
