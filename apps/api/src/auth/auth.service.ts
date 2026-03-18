import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

function envelope<T>(data: T) {
  return { data };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(body: LoginDto) {
    // Fail fast: never query users when credentials are missing.
    // This also prevents Prisma from accidentally returning an arbitrary active user
    // if `email` is undefined.
    const rawBody = body as any;
    // eslint-disable-next-line no-console
    console.log('[auth.login] incoming body keys', {
      keys:
        rawBody && typeof rawBody === 'object' ? Object.keys(rawBody) : null,
    });

    if (!body?.email || !body?.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // MVP assumption: email is unique per company. We'll pick the first user with that email.
    const user = await this.prisma.user.findFirst({
      where: { email: body.email, isActive: true },
      include: { company: true },
    });

    // DEBUG (temporary): helps diagnose why seeded credentials return 401.
    // Do not log the raw password.
    // eslint-disable-next-line no-console
    console.log('[auth.login]', {
      email: body?.email,
      hasPassword: Boolean(body?.password),
      foundUser: Boolean(user),
      isActive: user?.isActive,
      userId: user?.id,
      companyId: user?.companyId,
      hasPasswordHash: Boolean(user?.passwordHash),
    });

    // bcrypt.compare throws if any arg is undefined, so validate inputs first.
    if (!user?.passwordHash || !body.password)
      throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const accessToken = await this.signAccessToken({
      sub: user.id,
      companyId: user.companyId,
    });

    const refreshToken = await this.signRefreshToken({
      sub: user.id,
      companyId: user.companyId,
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    const refreshTtl = this.config.get<number>(
      'JWT_REFRESH_TTL_SECONDS',
      60 * 60 * 24 * 30,
    );
    const expiresAt = new Date(Date.now() + refreshTtl * 1000);

    // One active session per user for now (simple). We'll revoke previous ones.
    if (user.companyId) {
      await this.prisma.session.updateMany({
        where: { userId: user.id, companyId: user.companyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      await this.prisma.session.create({
        data: {
          userId: user.id,
          companyId: user.companyId,
          refreshTokenHash,
          expiresAt,
        },
      });
    }

    return envelope({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company_id: user.companyId,
      },
      company: user.company,
    });
  }

  async refresh(body: RefreshDto) {
    // We validate refresh token via JwtRefreshStrategy (signature + revocation via Session).
    // For simplicity we re-verify by attempting to find a matching stored session hash here too.
    const decoded = await this.jwt.verifyAsync<any>(body.refresh_token, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
    });

    const companyId: string | undefined = decoded?.companyId;
    const userId: string | undefined = decoded?.sub;
    if (!companyId || !userId) throw new UnauthorizedException();

    const session = await this.prisma.session.findFirst({
      where: {
        companyId,
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!session) throw new UnauthorizedException();

    const ok = await bcrypt.compare(
      body.refresh_token,
      session.refreshTokenHash,
    );
    if (!ok) throw new UnauthorizedException();

    const accessToken = await this.signAccessToken({ sub: userId, companyId });
    return envelope({ access_token: accessToken });
  }

  async me(accessPayload: { sub: string; companyId?: string | null }) {
    const user = await this.prisma.user.findUnique({
      where: { id: accessPayload.sub },
      include: { company: true },
    });
    if (!user) throw new UnauthorizedException();

    return envelope({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company_id: user.companyId,
      },
      company: user.company,
    });
  }

  async forgotPassword(body: ForgotPasswordDto) {
    const email = body.email.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: { email, isActive: true },
      include: { company: true },
    });

    if (!user?.companyId) {
      return envelope({
        ok: true,
        message:
          'If an account exists for this email, a reset link has been prepared.',
      });
    }

    const token = await this.jwt.signAsync(
      {
        sub: user.id,
        companyId: user.companyId,
        purpose: 'password_reset',
      },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: 60 * 30,
      },
    );

    return envelope({
      ok: true,
      message:
        'If an account exists for this email, a reset link has been prepared.',
      dev: {
        reset_token: token,
        reset_path: `/reset-password?token=${encodeURIComponent(token)}`,
      },
    });
  }

  async resetPassword(body: ResetPasswordDto) {
    let decoded: { sub?: string; companyId?: string; purpose?: string };
    try {
      decoded = await this.jwt.verifyAsync(body.token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (decoded.purpose !== 'password_reset' || !decoded.sub) {
      throw new BadRequestException('Invalid reset token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, companyId: true, isActive: true },
    });
    if (!user?.isActive) {
      throw new BadRequestException('User not found');
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      if (user.companyId) {
        await tx.session.updateMany({
          where: {
            userId: user.id,
            companyId: user.companyId,
            revokedAt: null,
          },
          data: { revokedAt: new Date() },
        });
      }
    });

    return envelope({
      ok: true,
      message: 'Password updated successfully. Please sign in again.',
    });
  }

  async logout(refreshPayload: {
    sub: string;
    companyId?: string | null;
    jti?: string;
  }) {
    // For MVP we revoke all active sessions for the user in the company.
    if (!refreshPayload.companyId) return envelope({ ok: true });

    await this.prisma.session.updateMany({
      where: {
        userId: refreshPayload.sub,
        companyId: refreshPayload.companyId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    return envelope({ ok: true });
  }

  async signAccessToken(payload: { sub: string; companyId?: string | null }) {
    const secret = this.config.get<string>('JWT_ACCESS_SECRET');
    const ttl = this.config.get<number>('JWT_ACCESS_TTL_SECONDS', 900);
    return this.jwt.signAsync(payload, { secret, expiresIn: ttl });
  }

  async signRefreshToken(payload: { sub: string; companyId?: string | null }) {
    const secret = this.config.get<string>('JWT_REFRESH_SECRET');
    const ttl = this.config.get<number>(
      'JWT_REFRESH_TTL_SECONDS',
      60 * 60 * 24 * 30,
    );
    return this.jwt.signAsync(payload, { secret, expiresIn: ttl });
  }
}
