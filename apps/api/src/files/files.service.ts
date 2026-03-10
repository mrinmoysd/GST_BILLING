import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID, createHmac } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

import { PrismaService } from '../prisma/prisma.service';
import { SignUploadDto } from './dto/sign-upload.dto';

function base64Url(input: Buffer) {
  return input
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService) {}

  private getSecret() {
    const secret = process.env.FILE_SIGNING_SECRET;
    if (!secret) {
      throw new BadRequestException(
        'FILE_SIGNING_SECRET is not configured on the server',
      );
    }
    return secret;
  }

  async signUpload(companyId: string, dto: SignUploadDto) {
    const fileId = randomUUID();

    const created = await this.prisma.file.create({
      data: {
        id: fileId,
        companyId,
        type: dto.type,
        storage: 'local',
        mimeType: dto.mime_type ?? null,
        sizeBytes: BigInt(dto.size_bytes),
        key: `uploads/${companyId}/${fileId}`,
        metadata: {},
      },
      select: { id: true },
    });

    const payload = {
      file_id: created.id,
      company_id: companyId,
      exp: Date.now() + 15 * 60 * 1000,
    };

    const secret = this.getSecret();
    const data = Buffer.from(JSON.stringify(payload));
    const sig = createHmac('sha256', secret).update(data).digest();

    const token = `${base64Url(data)}.${base64Url(sig)}`;

    // MVP: "upload_url" is a local API endpoint to be implemented later. For now we return token + file_id.
    return {
      file_id: created.id,
      upload_url: `/api/companies/${companyId}/files/upload?token=${token}`,
      token,
      expires_at: new Date(payload.exp).toISOString(),
    };
  }

  async getFile(companyId: string, fileId: string) {
    const row = await this.prisma.file.findFirst({
      where: { id: fileId, companyId },
    });
    if (!row) throw new NotFoundException('File not found');

    // MVP: return stored URL if present; otherwise return a predictable local path.
    return {
      id: row.id,
      type: row.type,
      url: row.url ?? null,
      key: row.key ?? null,
      mime_type: row.mimeType ?? null,
      size_bytes: row.sizeBytes ? Number(row.sizeBytes) : null,
    };
  }

  verifyUploadToken(args: { token: string; expectedCompanyId: string }): {
    fileId: string;
    companyId: string;
  } {
    const parts = String(args.token ?? '').split('.');
    if (parts.length !== 2) throw new BadRequestException('Invalid token');

    const [payloadPart, sigPart] = parts;

    const payloadJson = Buffer.from(
      payloadPart.replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf8');

    let payload: any;
    try {
      payload = JSON.parse(payloadJson);
    } catch {
      throw new BadRequestException('Invalid token payload');
    }

    if (!payload?.file_id || !payload?.company_id || !payload?.exp) {
      throw new BadRequestException('Invalid token payload');
    }
    if (payload.company_id !== args.expectedCompanyId) {
      throw new BadRequestException('Token company mismatch');
    }
    if (Date.now() > Number(payload.exp)) {
      throw new BadRequestException('Token expired');
    }

    const secret = this.getSecret();
    const data = Buffer.from(JSON.stringify(payload));
    const expectedSig = createHmac('sha256', secret).update(data).digest();
    const expectedSigEncoded = base64Url(expectedSig);
    if (expectedSigEncoded !== sigPart) {
      throw new BadRequestException('Invalid token signature');
    }

    return {
      fileId: String(payload.file_id),
      companyId: String(payload.company_id),
    };
  }

  async uploadFile(args: {
    companyId: string;
    token: string;
    bytes: Buffer;
    mimeType?: string;
  }) {
    const verified = this.verifyUploadToken({
      token: args.token,
      expectedCompanyId: args.companyId,
    });

    const file = await this.prisma.file.findFirst({
      where: { id: verified.fileId, companyId: verified.companyId },
    });
    if (!file) throw new NotFoundException('File record not found');

    const root =
      process.env.FILE_STORAGE_ROOT || join(process.cwd(), 'storage');
    const absPath = join(
      root,
      file.key ?? `uploads/${args.companyId}/${file.id}`,
    );

    await mkdir(join(absPath, '..'), { recursive: true });
    await writeFile(absPath, args.bytes);

    await this.prisma.file.update({
      where: { id: file.id },
      data: {
        url: `/api/companies/${args.companyId}/files/${file.id}`,
        mimeType: args.mimeType ?? file.mimeType,
        sizeBytes: BigInt(args.bytes.length),
      },
      select: { id: true },
    });

    return { ok: true, file_id: file.id };
  }
}
