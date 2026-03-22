import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: any) => req?.cookies?.refresh_token,
        ExtractJwt.fromBodyField('refresh_token'),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    const token: string | undefined =
      req?.cookies?.refresh_token ??
      req?.cookies?.admin_refresh_token ??
      req?.body?.refresh_token;
    if (!token) throw new UnauthorizedException();

    const companyId = payload.companyId;
    const userId = payload.sub;
    const isAdminScope =
      payload?.scope === 'admin' ||
      payload?.isSuperAdmin === true ||
      Array.isArray(payload?.roles);
    if (!userId) throw new UnauthorizedException();

    const session = await this.prisma.session.findFirst({
      where: {
        userId,
        companyId: isAdminScope ? null : companyId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!session) throw new UnauthorizedException();
    if (!isAdminScope && !companyId) throw new UnauthorizedException();

    const ok = await bcrypt.compare(token, session.refreshTokenHash);
    if (!ok) throw new UnauthorizedException();

    return payload;
  }
}
