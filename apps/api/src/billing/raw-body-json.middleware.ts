import type { Request } from 'express';

export type RawBodyRequest = Request & { rawBody?: Buffer };

export function getRawBodyUtf8(req: RawBodyRequest): string {
  if (req.rawBody && Buffer.isBuffer(req.rawBody)) {
    return req.rawBody.toString('utf8');
  }
  return '';
}
