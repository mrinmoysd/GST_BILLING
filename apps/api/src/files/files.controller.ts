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

import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { CompanyScopeGuard } from '../common/auth/company-scope.guard';
import { FilesService } from './files.service';
import { SignUploadDto } from './dto/sign-upload.dto';
import { UploadFileQueryDto } from './dto/upload-file.query.dto';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('/api/companies/:companyId')
@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard)
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post('/files/sign-upload')
  async signUpload(
    @Param('companyId') companyId: string,
    @Body() dto: SignUploadDto,
  ) {
    const data = await this.files.signUpload(companyId, dto);
    return { ok: true, data };
  }

  @Get('/files/:fileId')
  async get(
    @Param('companyId') companyId: string,
    @Param('fileId') fileId: string,
  ) {
    const data = await this.files.getFile(companyId, fileId);
    return { ok: true, data };
  }

  @Post('/files/upload')
  async upload(
    @Param('companyId') companyId: string,
    @Query() query: UploadFileQueryDto,
    @Body() body: any,
    @Headers('content-type') contentType?: string,
  ) {
    const bytes = Buffer.isBuffer(body)
      ? body
      : Buffer.from(
          typeof body === 'string' ? body : JSON.stringify(body ?? {}),
        );

    const data = await this.files.uploadFile({
      companyId,
      token: query.token,
      bytes,
      mimeType: contentType,
    });

    return { ok: true, data };
  }
}
