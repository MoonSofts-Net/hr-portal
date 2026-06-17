import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SkipAudit } from '../../common/decorators/skip-audit.decorator';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { AuthenticatedUser } from '../../security/interfaces/authenticated-user.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SelectTenantDto } from './dto/select-tenant.dto';
import { LogoutDto } from './dto/logout.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @SkipAudit()
  @RateLimit({ limit: 10, windowMs: 60_000, keyPrefix: 'auth:login' })
  @Post('login')
  @ApiOperation({ summary: 'Authenticate with email/CPF and password' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @SkipAudit()
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout — revokes refresh tokens and writes audit log' })
  logout(@CurrentUser() user: AuthenticatedUser, @Body() dto: LogoutDto, @Req() req: Request) {
    return this.authService.logout(user, dto.refreshToken, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Public()
  @SkipAudit()
  @RateLimit({ limit: 5, windowMs: 60_000, keyPrefix: 'auth:forgot-password' })
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset email via Resend' })
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    return this.authService.forgotPassword(dto, { ip: req.ip });
  }

  @Public()
  @SkipAudit()
  @RateLimit({ limit: 5, windowMs: 60_000, keyPrefix: 'auth:reset-password' })
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token from forgot-password flow' })
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    return this.authService.resetPassword(dto, { ip: req.ip });
  }

  @Post('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password (required on first login when mustChangePassword is set)' })
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    return this.authService.changePassword(user, dto, { ip: req.ip });
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current authenticated user (no sensitive PII)' })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user);
  }

  @Get('permissions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Effective permission IDs for current session' })
  getPermissions(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getPermissions(user);
  }

  @Post('select-tenant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Switch active tenant context (global operators)' })
  selectTenant(@CurrentUser() user: AuthenticatedUser, @Body() dto: SelectTenantDto) {
    return this.authService.selectTenant(user, dto);
  }
}
