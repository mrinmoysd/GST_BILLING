import { IsUUID } from 'class-validator';

export class MatchBankStatementLineDto {
  @IsUUID()
  statement_line_id!: string;

  @IsUUID()
  payment_id!: string;
}
