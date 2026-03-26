import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { FinanceOpsService } from './finance-ops.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { CreateCollectionTaskDto } from './dto/create-collection-task.dto';
import { UpdateCollectionTaskDto } from './dto/update-collection-task.dto';
import { ImportBankStatementDto } from './dto/import-bank-statement.dto';
import { MatchBankStatementLineDto } from './dto/match-bank-statement-line.dto';
import { UnmatchBankStatementLineDto } from './dto/unmatch-bank-statement-line.dto';

@ApiTags('FinanceOps')
@ApiBearerAuth()
@Controller('/api/companies/:companyId')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard)
export class FinanceOpsController {
  constructor(private readonly financeOps: FinanceOpsService) {}

  @Get('bank-accounts')
  listBankAccounts(@Param('companyId') companyId: string) {
    return this.financeOps.listBankAccounts(companyId);
  }

  @Post('bank-accounts')
  createBankAccount(
    @Param('companyId') companyId: string,
    @Body() dto: CreateBankAccountDto,
  ) {
    return this.financeOps.createBankAccount(companyId, dto);
  }

  @Patch('bank-accounts/:bankAccountId')
  updateBankAccount(
    @Param('companyId') companyId: string,
    @Param('bankAccountId') bankAccountId: string,
    @Body() dto: UpdateBankAccountDto,
  ) {
    return this.financeOps.updateBankAccount(companyId, bankAccountId, dto);
  }

  @Get('collections/tasks')
  listCollectionTasks(
    @Param('companyId') companyId: string,
    @Query('status') status?: string,
    @Query('assigned_to_user_id') assignedToUserId?: string,
    @Query('customer_id') customerId?: string,
  ) {
    return this.financeOps.listCollectionTasks({
      companyId,
      status,
      assignedToUserId,
      customerId,
    });
  }

  @Post('collections/tasks')
  createCollectionTask(
    @Param('companyId') companyId: string,
    @Body() dto: CreateCollectionTaskDto,
  ) {
    return this.financeOps.createCollectionTask(companyId, dto);
  }

  @Patch('collections/tasks/:taskId')
  updateCollectionTask(
    @Param('companyId') companyId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateCollectionTaskDto,
  ) {
    return this.financeOps.updateCollectionTask(companyId, taskId, dto);
  }

  @Get('bank-statements/imports')
  listBankStatementImports(
    @Param('companyId') companyId: string,
    @Query('bank_account_id') bankAccountId?: string,
  ) {
    return this.financeOps.listBankStatementImports({ companyId, bankAccountId });
  }

  @Post('bank-statements/imports')
  importBankStatement(
    @Param('companyId') companyId: string,
    @Body() dto: ImportBankStatementDto,
  ) {
    return this.financeOps.importBankStatement(companyId, dto);
  }

  @Get('bank-statements/lines')
  listBankStatementLines(
    @Param('companyId') companyId: string,
    @Query('status') status?: string,
    @Query('bank_account_id') bankAccountId?: string,
  ) {
    return this.financeOps.listBankStatementLines({
      companyId,
      status,
      bankAccountId,
    });
  }

  @Post('bank-reconciliation/match')
  matchStatementLine(
    @Param('companyId') companyId: string,
    @Body() dto: MatchBankStatementLineDto,
  ) {
    return this.financeOps.matchStatementLine(companyId, dto);
  }

  @Post('bank-reconciliation/unmatch')
  unmatchStatementLine(
    @Param('companyId') companyId: string,
    @Body() dto: UnmatchBankStatementLineDto,
  ) {
    return this.financeOps.unmatchStatementLine(companyId, dto);
  }
}
