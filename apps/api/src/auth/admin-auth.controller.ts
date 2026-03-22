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
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAccessAuthGuard } from './guards/jwt-access-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';

@ApiTags('Admin Auth')
@Controller('api/admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOkResponse({ description: 'OK' })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.authService.adminLogin(body);
    const refreshToken: string | undefined = result?.data?.refresh_token;

    if (refreshToken) {
      res.cookie('admin_refresh_token', refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/api/admin/auth',
      });

      delete (result as any).data.refresh_token;
    }

    return result;
  }

  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(200)
  @ApiOkResponse({ description: 'OK' })
  async refresh(@Req() req: any) {
    const token = req?.cookies?.admin_refresh_token;
    if (!token) throw new UnauthorizedException();
    return this.authService.adminRefresh({ refresh_token: token });
  }

  @Get('me')
  @UseGuards(JwtAccessAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'OK' })
  async me(@Req() req: any) {
    return this.authService.adminMe(req.user);
  }

  @Post('logout')
  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(200)
  @ApiOkResponse({ description: 'OK' })
  async logout(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const out = await this.authService.adminLogout(req.user);
    res.clearCookie('admin_refresh_token', { path: '/api/admin/auth' });
    return out;
  }
}
