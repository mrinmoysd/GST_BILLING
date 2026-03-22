import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service';
import {
  getInternalAdminPermissions,
  isInternalAdminRole,
} from '../admin/super/admin-roles.constants';
import { RbacService } from '../rbac/rbac.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

function envelope<T>(data: T) {
  return { data };
}

type TokenPayload = {
  sub: string;
  email?: string;
  companyId?: string | null;
  scope?: 'tenant' | 'admin';
  isSuperAdmin?: boolean;
  roles?: string[];
  permissions?: string[];
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly rbac: RbacService,
  ) {}

  async login(body: LoginDto) {
    if (!body?.email || !body?.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.validateCredentials(body);
    if (!user?.companyId) throw new UnauthorizedException('Invalid credentials');

    const payload: TokenPayload = {
      sub: user.id,
      companyId: user.companyId,
      scope: 'tenant',
    };

    const tokens = await this.issueSession(user.id, user.companyId, payload);
    const sessionAccess = await this.rbac.getSessionAccess(user.id);

    return envelope({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: sessionAccess.user,
      company: sessionAccess.company,
    });
  }

  async adminLogin(body: LoginDto) {
    if (!body?.email || !body?.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.validateCredentials(body);
    if (!isInternalAdminRole(user.role) || user.companyId) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const payload = this.buildAdminTokenPayload(user);
    const tokens = await this.issueSession(user.id, null, payload);

    return envelope({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: this.buildAdminSessionUser(user),
    });
  }

  async refresh(body: RefreshDto) {
    const decoded = await this.verifyRefreshToken(body.refresh_token);
    if (decoded.scope === 'admin' || decoded.isSuperAdmin) {
      throw new UnauthorizedException();
    }

    const companyId: string | undefined = decoded?.companyId ?? undefined;
    const userId: string | undefined = decoded?.sub;
    if (!companyId || !userId) throw new UnauthorizedException();

    await this.assertValidSession(userId, companyId, body.refresh_token);

    const accessToken = await this.signAccessToken({
      sub: userId,
      companyId,
      scope: 'tenant',
    });
    return envelope({ access_token: accessToken });
  }

  async adminRefresh(body: RefreshDto) {
    const decoded = await this.verifyRefreshToken(body.refresh_token);
    const userId: string | undefined = decoded?.sub;
    const isAdminScope =
      decoded.scope === 'admin' ||
      decoded.isSuperAdmin === true ||
      Array.isArray(decoded.roles);
    if (!userId || !isAdminScope) throw new UnauthorizedException();

    await this.assertValidSession(userId, null, body.refresh_token);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        isActive: true,
      },
    });
    if (!user || !user.isActive || !isInternalAdminRole(user.role) || user.companyId) {
      throw new UnauthorizedException();
    }

    const accessToken = await this.signAccessToken(
      this.buildAdminTokenPayload(user),
    );
    return envelope({ access_token: accessToken });
  }

  async me(accessPayload: TokenPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: accessPayload.sub },
      include: { company: true },
    });
    if (!user) throw new UnauthorizedException();

    if (accessPayload.scope === 'admin' || accessPayload.isSuperAdmin) {
      throw new UnauthorizedException();
    }

    const sessionAccess = await this.rbac.getSessionAccess(user.id);

    return envelope({
      user: sessionAccess.user,
      company: sessionAccess.company,
    });
  }

  async adminMe(accessPayload: TokenPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: accessPayload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        isActive: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    if (
      accessPayload.scope !== 'admin' &&
      accessPayload.isSuperAdmin !== true &&
      !Array.isArray(accessPayload.roles)
    ) {
      throw new UnauthorizedException();
    }
    if (!isInternalAdminRole(user.role) || user.companyId) {
      throw new UnauthorizedException();
    }

    return envelope({
      user: this.buildAdminSessionUser(user),
    });
  }

  async getSessionAccess(userId: string) {
    return this.rbac.getSessionAccess(userId);
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
    scope?: 'tenant' | 'admin';
    isSuperAdmin?: boolean;
  }) {
    const companyFilter: Prisma.SessionWhereInput['companyId'] =
      refreshPayload.scope === 'admin' || refreshPayload.isSuperAdmin
        ? { equals: null }
        : refreshPayload.companyId;

    await this.prisma.session.updateMany({
      where: {
        userId: refreshPayload.sub,
        companyId: companyFilter,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    return envelope({ ok: true });
  }

  async adminLogout(refreshPayload: TokenPayload) {
    return this.logout(refreshPayload);
  }

  async signAccessToken(payload: TokenPayload) {
    const secret = this.config.get<string>('JWT_ACCESS_SECRET');
    const ttl = this.config.get<number>('JWT_ACCESS_TTL_SECONDS', 900);
    return this.jwt.signAsync(payload, { secret, expiresIn: ttl });
  }

  async signRefreshToken(payload: TokenPayload) {
    const secret = this.config.get<string>('JWT_REFRESH_SECRET');
    const ttl = this.config.get<number>(
      'JWT_REFRESH_TTL_SECONDS',
      60 * 60 * 24 * 30,
    );
    return this.jwt.signAsync(payload, { secret, expiresIn: ttl });
  }

  private async validateCredentials(body: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: body.email.trim().toLowerCase(), isActive: true },
      include: { company: true },
    });

    if (!user?.passwordHash || !body.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  private async issueSession(
    userId: string,
    companyId: string | null,
    payload: TokenPayload,
  ) {
    const companyFilter: Prisma.SessionWhereInput['companyId'] =
      companyId === null ? { equals: null } : companyId;

    const accessToken = await this.signAccessToken(payload);
    const refreshToken = await this.signRefreshToken(payload);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    const refreshTtl = this.config.get<number>(
      'JWT_REFRESH_TTL_SECONDS',
      60 * 60 * 24 * 30,
    );
    const expiresAt = new Date(Date.now() + refreshTtl * 1000);

    await this.prisma.session.updateMany({
      where: { userId, companyId: companyFilter, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.prisma.session.create({
      data: {
        userId,
        ...(companyId === null ? {} : { companyId }),
        refreshTokenHash,
        expiresAt,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
    });

    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(token: string) {
    return this.jwt.verifyAsync<TokenPayload>(token, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
    });
  }

  private async assertValidSession(
    userId: string,
    companyId: string | null,
    refreshToken: string,
  ) {
    const companyFilter: Prisma.SessionWhereInput['companyId'] =
      companyId === null ? { equals: null } : companyId;

    const session = await this.prisma.session.findFirst({
      where: {
        userId,
        companyId: companyFilter,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!session) throw new UnauthorizedException();

    const ok = await bcrypt.compare(refreshToken, session.refreshTokenHash);
    if (!ok) throw new UnauthorizedException();

    return session;
  }

  private buildAdminSessionUser(user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    companyId?: string | null;
    isActive?: boolean;
  }) {
    const permissions = getInternalAdminPermissions(user.role);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      assigned_roles: [user.role],
      permissions,
      company_id: null,
      is_super_admin: user.role === 'super_admin',
      is_active: user.isActive ?? true,
    };
  }

  private buildAdminTokenPayload(user: {
    id: string;
    email: string;
    role: string;
  }): TokenPayload {
    return {
      sub: user.id,
      email: user.email,
      companyId: null,
      scope: 'admin',
      isSuperAdmin: user.role === 'super_admin',
      roles: [user.role],
      permissions: getInternalAdminPermissions(user.role),
    };
  }
}
