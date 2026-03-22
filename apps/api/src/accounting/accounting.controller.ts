import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { AccountingService } from './accounting.service';
import { CreateLedgerDto } from './dto/create-ledger.dto';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdatePeriodLockDto } from './dto/update-period-lock.dto';

@ApiTags('Accounting')
@Controller('/api/companies/:companyId')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard)
export class AccountingController {
  constructor(private readonly accounting: AccountingService) {}

  @Get('/ledgers')
  async listLedgers(@Param('companyId') companyId: string) {
    const data = await this.accounting.listLedgers(companyId);
    return { ok: true, data };
  }

  @Post('/ledgers')
  async createLedger(
    @Param('companyId') companyId: string,
    @Body() dto: CreateLedgerDto,
  ) {
    const data = await this.accounting.createLedger(companyId, dto);
    return { ok: true, data };
  }

  @Get('/journals')
  async listJournals(
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.accounting.listJournals({
      companyId,
      from,
      to,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('/journals/:id')
  async getJournal(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.accounting.getJournal(companyId, id);
    if (!data) throw new NotFoundException('Journal not found');
    return { ok: true, data };
  }

  @Post('/journals')
  async createJournal(
    @Param('companyId') companyId: string,
    @Body() dto: CreateJournalDto,
  ) {
    const data = await this.accounting.createJournal(companyId, dto);
    return { ok: true, data };
  }

  @Get('/accounting/period-lock')
  async getPeriodLock(@Param('companyId') companyId: string) {
    const data = await this.accounting.getPeriodLock(companyId);
    return { ok: true, data };
  }

  @Put('/accounting/period-lock')
  async updatePeriodLock(
    @Param('companyId') companyId: string,
    @Body() dto: UpdatePeriodLockDto,
  ) {
    const data = await this.accounting.updatePeriodLock(companyId, dto);
    return { ok: true, data };
  }

  @Get('/reports/trial-balance')
  async trialBalance(
    @Param('companyId') companyId: string,
    @Query('as_of') asOf?: string,
  ) {
    const data = await this.accounting.trialBalance(companyId, asOf ?? '');
    return { ok: true, data };
  }

  @Get('/reports/profit-loss')
  async profitLoss(
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const data = await this.accounting.profitLoss(
      companyId,
      from ?? '',
      to ?? '',
    );
    return { ok: true, data };
  }

  @Get('/reports/balance-sheet')
  async balanceSheet(
    @Param('companyId') companyId: string,
    @Query('as_of') asOf?: string,
  ) {
    const data = await this.accounting.balanceSheet(companyId, asOf ?? '');
    return { ok: true, data };
  }

  @Get('/books/cash')
  async cashBook(
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const data = await this.accounting.cashBook(
      companyId,
      from ?? '',
      to ?? '',
    );
    return { ok: true, data };
  }

  @Get('/books/bank')
  async bankBook(
    @Param('companyId') companyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const data = await this.accounting.bankBook(
      companyId,
      from ?? '',
      to ?? '',
    );
    return { ok: true, data };
  }
}
