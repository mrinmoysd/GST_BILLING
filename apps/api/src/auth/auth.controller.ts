import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import {
  getRefreshClearCookieOptions,
  getRefreshCookieOptions,
} from '../common/config/http-runtime.config';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAccessAuthGuard } from './guards/jwt-access-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOkResponse({ description: 'OK' })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.authService.login(body);

    const refreshToken: string | undefined = result?.data?.refresh_token;
    if (refreshToken) {
      res.cookie(
        'refresh_token',
        refreshToken,
        getRefreshCookieOptions('/api/auth'),
      );

      // Don't expose refresh token in response body.
      delete (result as any).data.refresh_token;
    }

    return result;
  }

  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(200)
  @ApiOkResponse({ description: 'OK' })
  async refresh(@Req() req: any, @Body() body: Partial<RefreshDto>) {
    const token = req?.cookies?.refresh_token ?? body?.refresh_token;
    if (!token) throw new UnauthorizedException();
    return this.authService.refresh({ refresh_token: token });
  }

  @Get('me')
  @UseGuards(JwtAccessAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'OK' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async me(@Req() req: any) {
    return this.authService.me(req.user);
  }

  @Post('forgot-password')
  @HttpCode(200)
  @ApiOkResponse({ description: 'OK' })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body);
  }

  @Post('reset-password')
  @HttpCode(200)
  @ApiOkResponse({ description: 'OK' })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @Post('logout')
  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(200)
  @ApiOkResponse({ description: 'OK' })
  async logout(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const out = await this.authService.logout(req.user);
    res.clearCookie(
      'refresh_token',
      getRefreshClearCookieOptions('/api/auth'),
    );
    return out;
  }
}
