import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { PaymentsService } from './payments.service';
import { RecordPaymentDto } from './dto/record-payment.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('/api/companies/:companyId/payments')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard)
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
  ) {
    return this.payments.list({
      companyId,
      page: Number(page),
      limit: Number(limit),
      from,
      to,
      method,
    });
  }

  @Post()
  record(
    @Param('companyId') companyId: string,
    @Body() dto: RecordPaymentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.payments.record({ companyId, dto, idempotencyKey });
  }
}
