import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { PermissionGuard } from '../common/auth/permission.guard';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { PaymentsService } from './payments.service';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { UpdatePaymentInstrumentDto } from './dto/update-payment-instrument.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('/api/companies/:companyId/payments')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard, PermissionGuard)
@RequirePermissions('payments.view')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  list(
    @Param('companyId') companyId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('method') method?: string,
    @Query('instrument_status') instrumentStatus?: string,
    @Query('bank_account_id') bankAccountId?: string,
  ) {
    return this.payments.list({
      companyId,
      page: Number(page),
      limit: Number(limit),
      from,
      to,
      method,
      instrumentStatus,
      bankAccountId,
    });
  }

  @Post()
  @RequirePermissions('payments.manage')
  record(
    @Param('companyId') companyId: string,
    @Body() dto: RecordPaymentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.payments.record({ companyId, dto, idempotencyKey });
  }

  @Patch(':paymentId')
  @RequirePermissions('payments.manage')
  updateInstrument(
    @Param('companyId') companyId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: UpdatePaymentInstrumentDto,
  ) {
    return this.payments.updateInstrument({ companyId, paymentId, dto });
  }
}
