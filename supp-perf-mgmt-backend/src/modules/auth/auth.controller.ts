import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UserDto } from './dto/user.dto';
import { ValidateResponseDto } from './dto/validate-response.dto';
import { SessionAuthGuard } from './guards/session-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('login')
  @ApiOperation({
    summary:
      'Initiates SSO login. Stub: sets the session cookie immediately for a hardcoded identity and redirects to the frontend root (no external OAuth redirect yet).',
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirect to / with the session cookie set.',
  })
  async login(@Res({ passthrough: true }) res: Response): Promise<void> {
    await this.authService.login(res);
    const frontendBaseUrl = this.configService.get<string>('FRONTEND_BASE_URL');

    if (!frontendBaseUrl) {
      throw new InternalServerErrorException('FRONTEND_BASE_URL is not configured');
    }

    let target: string;
    try {
      // Validates absolute URL and normalizes it
      const normalized = new URL(frontendBaseUrl);
      target = normalized.toString();
    } catch {
      throw new InternalServerErrorException('FRONTEND_BASE_URL is invalid');
    }

    res.redirect(HttpStatus.FOUND, target);
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Returns the profile of the currently authenticated user.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: UserDto })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Session cookie missing or expired.',
  })
  me(@Req() req: Request): UserDto {
    return this.authService.toUserDto(req.user!);
  }

  @Post('logout')
  @UseGuards(SessionAuthGuard)
  @ApiCookieAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Clears the session cookie and invalidates the server-side session.',
  })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No active session.',
  })
  logout(@Res({ passthrough: true }) res: Response): void {
    this.authService.logout(res);
  }

  @Post('validate')
  @UseGuards(SessionAuthGuard)
  @ApiCookieAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validates the session cookie and returns its claims/expiry.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: ValidateResponseDto })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token invalid or expired.',
  })
  validate(@Req() req: Request): ValidateResponseDto {
    return { valid: true, expiresAt: req.sessionExpiresAt! };
  }
}
