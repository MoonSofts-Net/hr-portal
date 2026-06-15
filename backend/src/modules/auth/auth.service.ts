import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { FieldEncryptionService } from '../../security/field-encryption.service';
import { PasswordHasherService } from '../../security/password-hasher.service';
import { AuthenticatedUser } from '../../security/interfaces/authenticated-user.interface';
import { DomainAuditService } from '../audit-logs/domain-audit.service';
import { ResendIntegration } from '../../integrations/resend/resend.integration';
import { passwordResetEmailHtml } from '../../integrations/resend/email-templates';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SelectTenantDto } from './dto/select-tenant.dto';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { PermissionsResolverService } from './services/permissions-resolver.service';

const GENERIC_AUTH_MESSAGE = 'Invalid credentials';
const GENERIC_RESET_MESSAGE =
  'If the account exists, password reset instructions will be sent.';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly fieldEncryption: FieldEncryptionService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly permissionsResolver: PermissionsResolverService,
    private readonly audit: DomainAuditService,
    private readonly resend: ResendIntegration,
  ) {}

  async login(dto: LoginDto, meta?: { ip?: string; userAgent?: string }) {
    const user = await this.findUserForLogin(dto);

    if (!user || user.status !== 'ACTIVE') {
      await this.recordLoginFailure(dto, meta, user?.tenantId, user?.id);
      throw new UnauthorizedException(GENERIC_AUTH_MESSAGE);
    }

    const valid = await this.passwordHasher.verify(dto.password, user.passwordHash);
    if (!valid) {
      await this.recordLoginFailure(dto, meta, user.tenantId, user.id);
      throw new UnauthorizedException(GENERIC_AUTH_MESSAGE);
    }

    const primaryRole = user.userRoles[0]?.role;
    if (!primaryRole) {
      throw new UnauthorizedException('User has no assigned role');
    }

    const mfaVerified = !user.mfaEnabled;
    const sessionId = this.sessionService.createSessionId();
    const activeTenantId = user.tenantId;
    const tokens = await this.issueTokenPair({
      userId: user.id,
      email: user.email,
      homeTenantId: user.tenantId,
      activeTenantId,
      roleId: primaryRole.id,
      sessionId,
      mfaVerified,
      refreshPersist: true,
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.audit.recordEvent('LOGIN_SUCCESS', {
      tenantId: user.tenantId,
      actorUserId: user.id,
      entityId: user.id,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return {
      ...tokens,
      requiresMfa: user.mfaEnabled && !mfaVerified,
      user: this.toSafeUserSummary(user, primaryRole.name, activeTenantId),
    };
  }

  async logout(
    user: AuthenticatedUser,
    refreshToken?: string,
    meta?: { ip?: string; userAgent?: string },
  ) {
    if (refreshToken) {
      await this.sessionService.revokeRefreshToken(refreshToken);
    } else {
      await this.sessionService.revokeAllUserSessions(user.userId);
    }

    await this.audit.recordEvent('LOGOUT', {
      tenantId: user.activeTenantId,
      actorUserId: user.userId,
      entityId: user.userId,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });
    return { success: true };
  }

  async getMe(user: AuthenticatedUser) {
    const dbUser = await this.prisma.user.findFirst({
      where: { id: user.userId, tenantId: user.homeTenantId },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        mfaEnabled: true,
        avatarUrl: true,
        lastLoginAt: true,
        tenant: { select: { id: true, name: true, slug: true } },
        branch: { select: { id: true, code: true, name: true } },
      },
    });

    if (!dbUser) throw new UnauthorizedException();

    const activeTenant = await this.prisma.tenant.findUnique({
      where: { id: user.activeTenantId },
      select: { id: true, name: true, slug: true },
    });

    const role = await this.prisma.role.findUnique({
      where: { id: user.roleId },
      select: { id: true, name: true, isSystem: true, isGlobal: true },
    });

    const permissions = await this.permissionsResolver.resolveForRole(user.roleId);

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      status: dbUser.status,
      avatarUrl: dbUser.avatarUrl,
      lastLoginAt: dbUser.lastLoginAt,
      mfaEnabled: dbUser.mfaEnabled,
      mfaVerified: user.mfaVerified,
      branch: dbUser.branch,
      homeTenant: dbUser.tenant,
      activeTenant: activeTenant ?? dbUser.tenant,
      role: role ?? { id: user.roleId, name: user.roleName },
      isSuperAdmin: user.isSuperAdmin,
      isGlobal: user.isGlobal,
      permissions: permissions.filter((p) => p !== '*'),
    };
  }

  getPermissions(user: AuthenticatedUser) {
    return {
      permissions: user.permissionIds.filter((p) => p !== '*'),
      isSuperAdmin: user.isSuperAdmin,
    };
  }

  async selectTenant(user: AuthenticatedUser, dto: SelectTenantDto) {
    if (!user.isGlobal && !user.isSuperAdmin) {
      throw new ForbiddenException('Tenant selection requires a global operator role');
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: { id: dto.tenantId, isActive: true },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const tokens = await this.issueTokenPair({
      userId: user.userId,
      email: user.email,
      homeTenantId: user.homeTenantId,
      activeTenantId: tenant.id,
      roleId: user.roleId,
      sessionId: user.sessionId,
      mfaVerified: user.mfaVerified,
      refreshPersist: false,
    });

    return {
      ...tokens,
      activeTenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto, meta?: { ip?: string }) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        ...(dto.tenantSlug ? { tenant: { slug: dto.tenantSlug } } : {}),
      },
      select: { id: true, email: true, tenantId: true },
    });

    const tenantId = user?.tenantId ?? (await this.resolveTenantIdBySlug(dto.tenantSlug));

    if (user && tenantId) {
      const resetToken = await this.tokenService.signPasswordResetToken({
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
      });

      await this.audit.recordEvent('PASSWORD_RESET_REQUEST', {
        tenantId,
        actorUserId: user.id,
        targetUserId: user.id,
        entityId: user.id,
        ipAddress: meta?.ip,
        metadata: { email },
      });

      const appUrl = this.config.get<string>('appUrl', 'http://localhost:3000');
      const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

      const dbUser = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true },
      });

      if (this.resend.isEnabled()) {
        await this.resend.send({
          to: user.email,
          subject: 'Redefinição de senha — Portal RH',
          html: passwordResetEmailHtml({
            name: dbUser?.name ?? user.email,
            resetUrl,
          }),
          text: `Redefina sua senha acessando: ${resetUrl}`,
        });
      } else if (this.config.get('nodeEnv') === 'development') {
        return {
          message: GENERIC_RESET_MESSAGE,
          _devResetToken: resetToken,
        };
      }
    }

    return { message: GENERIC_RESET_MESSAGE };
  }

  async resetPassword(dto: ResetPasswordDto, meta?: { ip?: string }) {
    const payload = await this.tokenService.verifyPasswordResetToken(dto.token);
    const passwordHash = await this.passwordHasher.hash(dto.newPassword);

    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { passwordHash, status: 'ACTIVE' },
    });

    await this.sessionService.revokeAllUserSessions(payload.sub);

    await this.audit.recordEvent('USER_UPDATED', {
      tenantId: payload.tenantId,
      actorUserId: payload.sub,
      targetUserId: payload.sub,
      entityId: payload.sub,
      ipAddress: meta?.ip,
      metadata: { event: 'password_reset_completed' },
    });

    return { message: 'Password updated successfully' };
  }

  private async recordLoginFailure(
    dto: LoginDto,
    meta?: { ip?: string; userAgent?: string },
    tenantId?: string,
    userId?: string,
  ) {
    const resolvedTenant =
      tenantId ?? (await this.resolveTenantIdBySlug(dto.tenantSlug)) ?? undefined;
    if (!resolvedTenant) return;

    await this.audit.recordEvent('LOGIN_FAILURE', {
      tenantId: resolvedTenant,
      actorUserId: userId ?? null,
      targetUserId: userId,
      entityId: userId,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      metadata: { identifier: dto.identifier.replace(/\d{11,}/g, '[CPF]') },
    });
  }

  private async resolveTenantIdBySlug(slug?: string) {
    if (!slug) return null;
    const tenant = await this.prisma.tenant.findFirst({ where: { slug } });
    return tenant?.id ?? null;
  }

  private async findUserForLogin(dto: LoginDto) {
    const identifier = dto.identifier.trim().toLowerCase();
    const cpfDigits = identifier.replace(/\D/g, '');

    return this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          ...(cpfDigits.length >= 11
            ? [{ employeeProfile: { cpfHash: this.fieldEncryption.hashForLookup(cpfDigits) } }]
            : []),
        ],
        ...(dto.tenantSlug ? { tenant: { slug: dto.tenantSlug } } : {}),
      },
      include: {
        tenant: true,
        userRoles: {
          where: { isPrimary: true },
          take: 1,
          include: { role: true },
        },
      },
    });
  }

  private async issueTokenPair(params: {
    userId: string;
    email: string;
    homeTenantId: string;
    activeTenantId: string;
    roleId: string;
    sessionId: string;
    mfaVerified: boolean;
    refreshPersist: boolean;
  }) {
    const accessToken = await this.tokenService.signAccessToken({
      sub: params.userId,
      email: params.email,
      homeTenantId: params.homeTenantId,
      activeTenantId: params.activeTenantId,
      roleId: params.roleId,
      sid: params.sessionId,
      mfaVerified: params.mfaVerified,
    });

    const refreshToken = await this.tokenService.signRefreshToken({
      sub: params.userId,
      sid: params.sessionId,
      homeTenantId: params.homeTenantId,
      activeTenantId: params.activeTenantId,
    });

    if (params.refreshPersist) {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await this.sessionService.persistRefreshToken({
        tenantId: params.homeTenantId,
        userId: params.userId,
        refreshToken,
        expiresAt,
      });
    }

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer' as const,
      expiresIn: this.tokenService.getAccessExpiresInSeconds(),
    };
  }

  private toSafeUserSummary(
    user: {
      id: string;
      email: string;
      name: string;
      tenantId: string;
      mfaEnabled: boolean;
      tenant: { id: string; name: string; slug: string };
    },
    roleName: string,
    activeTenantId: string,
  ) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      homeTenantId: user.tenantId,
      activeTenantId,
      tenantName: user.tenant.name,
      tenantSlug: user.tenant.slug,
      roleName,
      mfaEnabled: user.mfaEnabled,
    };
  }
}
