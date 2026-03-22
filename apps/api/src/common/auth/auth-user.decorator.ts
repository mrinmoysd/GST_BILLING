import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type AuthUserPayload = {
  sub: string;
  companyId?: string | null;
  scope?: 'tenant' | 'admin';
  isSuperAdmin?: boolean;
  roles?: string[];
};

export const AuthUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUserPayload => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
