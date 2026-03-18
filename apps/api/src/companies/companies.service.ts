import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  private getLogoStorageDir() {
    return path.join(process.cwd(), 'storage', 'companies');
  }

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

  async verifyGstin(companyId: string) {
    const company = await this.getCompany(companyId);

    const currentSettings =
      company.invoiceSettings && typeof company.invoiceSettings === 'object'
        ? (company.invoiceSettings as Record<string, unknown>)
        : {};

    const verification = {
      status: company.gstin ? 'verification_started' : 'not_available',
      requested_at: new Date().toISOString(),
      gstin: company.gstin ?? null,
      note: company.gstin
        ? 'GSTIN verification is currently staged and pending external integration.'
        : 'Add a GSTIN before starting verification.',
    };

    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        invoiceSettings: {
          ...currentSettings,
          gstin_verification: verification,
        } as any,
      },
    });

    return verification;
  }

  async attachLogo(companyId: string, file: {
    buffer: Buffer;
    originalname?: string;
  }) {
    await this.getCompany(companyId);

    const storageDir = this.getLogoStorageDir();
    fs.mkdirSync(storageDir, { recursive: true });

    const existingFiles = fs
      .readdirSync(storageDir, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter(
        (name) => name.startsWith(`company_${companyId}.`) || name === `company_${companyId}`,
      );

    for (const filename of existingFiles) {
      fs.rmSync(path.join(storageDir, filename), { force: true });
    }

    const ext = path.extname(file.originalname || '') || '.bin';
    const filename = `company_${companyId}${ext}`;
    fs.writeFileSync(path.join(storageDir, filename), file.buffer);

    return this.prisma.company.update({
      where: { id: companyId },
      data: {
        logoUrl: `/api/companies/${companyId}/logo`,
        updatedAt: new Date(),
      },
    });
  }

  getLogoPath(companyId: string) {
    const storageDir = this.getLogoStorageDir();
    if (!fs.existsSync(storageDir)) {
      throw new NotFoundException('Logo not found');
    }

    const filename = fs
      .readdirSync(storageDir, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .find(
        (name) => name.startsWith(`company_${companyId}.`) || name === `company_${companyId}`,
      );

    if (!filename) {
      throw new NotFoundException('Logo not found');
    }

    return path.join(storageDir, filename);
  }
}
