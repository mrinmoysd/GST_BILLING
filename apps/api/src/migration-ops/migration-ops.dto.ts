import { PartialType } from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateMigrationProjectDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source_system?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  go_live_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMigrationProjectDto extends PartialType(
  CreateMigrationProjectDto,
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateImportProfileDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entity_type!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  source_format!: string;

  @ApiProperty()
  @IsObject()
  column_mappings!: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;
}

export class UpdateImportProfileDto extends PartialType(
  CreateImportProfileDto,
) {}

export class UploadImportJobDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entity_type!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source_format?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  migration_project_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  import_profile_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  file_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  file_content_base64?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  file_content_text?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  column_mapping?: Record<string, string>;
}

export class CreatePrintTemplateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  template_type!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  layout?: Record<string, unknown>;
}

export class CreatePrintTemplateVersionDto {
  @ApiProperty()
  @IsObject()
  layout!: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  sample_options?: Record<string, unknown>;
}

export class PreviewPrintTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  document_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  document_id?: string;
}

export class CreateCustomFieldDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entity_type!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  field_type!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_searchable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_printable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_exportable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  default_value?: unknown;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  validation?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  options?: unknown[];
}

export class UpdateCustomFieldDto extends PartialType(CreateCustomFieldDto) {}

export class SetCustomFieldValueDto {
  @ApiProperty()
  @IsUUID()
  definition_id!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entity_type!: string;

  @ApiProperty()
  @IsUUID()
  entity_id!: string;

  @ApiProperty()
  value!: unknown;
}

export class CreateWebhookEndpointDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  url!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  secret!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  subscribed_events?: string[];
}

export class UpdateWebhookEndpointDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  secret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  subscribed_events?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class TestWebhookEndpointDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  event_type?: string;
}

export class CreateIntegrationApiKeyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class UploadAliasDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source_format?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['create_only', 'upsert_by_key', 'validate_only'])
  mode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  migration_project_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  import_profile_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  file_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  file_content_base64?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  file_content_text?: string;
}
