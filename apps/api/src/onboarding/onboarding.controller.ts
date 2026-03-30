import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { getRefreshCookieOptions } from '../common/config/http-runtime.config';
import { BootstrapOnboardingDto } from './dto/bootstrap-onboarding.dto';
import { OnboardingService } from './onboarding.service';

@ApiTags('Onboarding')
@Controller('api/onboarding')
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Post('bootstrap')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Bootstrap company, owner user, and authenticated session' })
  async bootstrap(
    @Body() dto: BootstrapOnboardingDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.onboarding.bootstrap(dto);
    const refreshToken = result.refresh_token;

    if (refreshToken) {
      res.cookie(
        'refresh_token',
        refreshToken,
        getRefreshCookieOptions('/api/auth'),
      );
      delete (result as any).refresh_token;
    }

    return { data: result };
  }
}
