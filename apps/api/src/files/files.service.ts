import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID, createHmac, createHash } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
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

  private getStorageDriver() {
    const driver = process.env.FILE_STORAGE_DRIVER ?? 'local';
    if (driver !== 'local' && driver !== 's3' && driver !== 'minio') {
      throw new BadRequestException('Unsupported FILE_STORAGE_DRIVER');
    }
    return driver;
  }

  private getObjectStorageConfig() {
    const bucket = process.env.FILE_STORAGE_BUCKET;
    const accessKeyId = process.env.FILE_STORAGE_ACCESS_KEY_ID;
    const secretAccessKey = process.env.FILE_STORAGE_SECRET_ACCESS_KEY;
    const region = process.env.FILE_STORAGE_REGION ?? 'ap-south-1';
    const endpoint = process.env.FILE_STORAGE_ENDPOINT ?? null;

    if (!bucket || !accessKeyId || !secretAccessKey) {
      throw new BadRequestException(
        'FILE_STORAGE_BUCKET, FILE_STORAGE_ACCESS_KEY_ID, and FILE_STORAGE_SECRET_ACCESS_KEY are required',
      );
    }

    return {
      bucket,
      accessKeyId,
      secretAccessKey,
      region,
      endpoint,
    };
  }

  private resolveLocalRoot() {
    return process.env.FILE_STORAGE_ROOT || join(process.cwd(), 'storage');
  }

  private sha256Hex(input: Buffer | string) {
    return createHash('sha256').update(input).digest('hex');
  }

  private hmacSha256(key: Buffer | string, data: string) {
    return createHmac('sha256', key).update(data).digest();
  }

  private signAwsV4(args: {
    method: 'GET' | 'PUT';
    bucket: string;
    key: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string | null;
    contentType?: string | null;
    body?: Buffer;
  }) {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const endpoint =
      args.endpoint?.replace(/\/+$/, '') ??
      `https://${args.bucket}.s3.${args.region}.amazonaws.com`;
    const url = new URL(
      args.endpoint
        ? `${endpoint}/${args.bucket}/${args.key}`
        : `${endpoint}/${args.key}`,
    );
    const host = url.host;
    const canonicalUri = url.pathname;
    const payloadHash = this.sha256Hex(args.body ?? Buffer.alloc(0));

    const canonicalHeaders = [
      `host:${host}`,
      `x-amz-content-sha256:${payloadHash}`,
      `x-amz-date:${amzDate}`,
    ].join('\n');
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = [
      args.method,
      canonicalUri,
      '',
      `${canonicalHeaders}\n`,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const credentialScope = `${dateStamp}/${args.region}/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      this.sha256Hex(canonicalRequest),
    ].join('\n');

    const kDate = this.hmacSha256(`AWS4${args.secretAccessKey}`, dateStamp);
    const kRegion = this.hmacSha256(kDate, args.region);
    const kService = this.hmacSha256(kRegion, 's3');
    const kSigning = this.hmacSha256(kService, 'aws4_request');
    const signature = createHmac('sha256', kSigning)
      .update(stringToSign)
      .digest('hex');

    return {
      url: url.toString(),
      headers: {
        authorization: `AWS4-HMAC-SHA256 Credential=${args.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
        host,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        ...(args.contentType ? { 'content-type': args.contentType } : {}),
      },
    };
  }

  private async putObject(args: {
    key: string;
    bytes: Buffer;
    mimeType?: string | null;
  }) {
    const storage = this.getStorageDriver();
    if (storage === 'local') {
      const absPath = join(this.resolveLocalRoot(), args.key);
      await mkdir(join(absPath, '..'), { recursive: true });
      await writeFile(absPath, args.bytes);
      return;
    }

    const config = this.getObjectStorageConfig();
    const signed = this.signAwsV4({
      method: 'PUT',
      bucket: config.bucket,
      key: args.key,
      region: config.region,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      endpoint: config.endpoint,
      contentType: args.mimeType ?? 'application/octet-stream',
      body: args.bytes,
    });

    const response = await fetch(signed.url, {
      method: 'PUT',
      headers: signed.headers,
      body: new Uint8Array(args.bytes),
    });

    if (!response.ok) {
      throw new BadRequestException(
        `Object upload failed with status ${response.status}`,
      );
    }
  }

  private async getObjectBytes(args: { key: string }) {
    const storage = this.getStorageDriver();
    if (storage === 'local') {
      const absPath = join(this.resolveLocalRoot(), args.key);
      return readFile(absPath);
    }

    const config = this.getObjectStorageConfig();
    const signed = this.signAwsV4({
      method: 'GET',
      bucket: config.bucket,
      key: args.key,
      region: config.region,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      endpoint: config.endpoint,
    });

    const response = await fetch(signed.url, {
      method: 'GET',
      headers: signed.headers,
    });

    if (!response.ok) {
      throw new NotFoundException('Stored file content not found');
    }

    return Buffer.from(await response.arrayBuffer());
  }

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
    const storage = this.getStorageDriver();
    const bucket =
      storage === 'local' ? null : this.getObjectStorageConfig().bucket;
    const key = `uploads/${companyId}/${fileId}`;

    const created = await this.prisma.file.create({
      data: {
        id: fileId,
        companyId,
        type: dto.type,
        storage,
        bucket,
        mimeType: dto.mime_type ?? null,
        sizeBytes: BigInt(dto.size_bytes),
        key,
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
      storage,
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
      download_url: `/api/companies/${companyId}/files/${fileId}/content`,
      storage: row.storage,
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
    const key = file.key ?? `uploads/${args.companyId}/${file.id}`;

    await this.putObject({
      key,
      bytes: args.bytes,
      mimeType: args.mimeType ?? file.mimeType,
    });

    await this.prisma.file.update({
      where: { id: file.id },
      data: {
        url: `/api/companies/${args.companyId}/files/${file.id}`,
        mimeType: args.mimeType ?? file.mimeType,
        sizeBytes: BigInt(args.bytes.length),
        checksumSha256: this.sha256Hex(args.bytes),
      },
      select: { id: true },
    });

    return { ok: true, file_id: file.id };
  }

  async getFileContent(companyId: string, fileId: string) {
    const file = await this.prisma.file.findFirst({
      where: { id: fileId, companyId },
    });
    if (!file) throw new NotFoundException('File not found');
    if (!file.key) throw new NotFoundException('File storage key is missing');

    const bytes = await this.getObjectBytes({ key: file.key });

    return {
      bytes,
      mimeType: file.mimeType ?? 'application/octet-stream',
    };
  }
}
