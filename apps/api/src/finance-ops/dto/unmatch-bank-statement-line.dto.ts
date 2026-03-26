import { IsUUID } from 'class-validator';

export class UnmatchBankStatementLineDto {
  @IsUUID()
  statement_line_id!: string;
}
