import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AuthenticatedUser } from '../../../security/interfaces/authenticated-user.interface';
import { PermissionsResolverService } from '../services/permissions-resolver.service';
import { JwtAccessPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly permissionsResolver: PermissionsResolverService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret'),
    });
  }

  async validate(payload: JwtAccessPayload): Promise<AuthenticatedUser> {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, tenantId: payload.homeTenantId },
      include: {
        userRoles: {
          where: { isPrimary: true },
          take: 1,
          include: { role: true },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User inactive or not found');
    }

    const role = user.userRoles[0]?.role;
    if (!role || role.id !== payload.roleId) {
      throw new UnauthorizedException('Role assignment changed');
    }

    const isSuperAdmin = role.isSystem && role.isGlobal;
    const activeTenantId = payload.activeTenantId ?? payload.homeTenantId;

    if (!isSuperAdmin && activeTenantId !== payload.homeTenantId) {
      throw new UnauthorizedException('Cross-tenant session not allowed');
    }

    if (isSuperAdmin) {
      const tenantExists = await this.prisma.tenant.findFirst({
        where: { id: activeTenantId, isActive: true },
      });
      if (!tenantExists) {
        throw new UnauthorizedException('Active tenant invalid');
      }
    }

    const permissionIds = await this.permissionsResolver.resolveForRole(role.id);

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      homeTenantId: payload.homeTenantId,
      activeTenantId,
      tenantId: activeTenantId,
      roleId: role.id,
      roleName: role.name,
      sessionId: payload.sid,
      permissionIds,
      isSuperAdmin,
      isGlobal: role.isGlobal,
      mfaEnabled: user.mfaEnabled,
      mfaVerified: payload.mfaVerified ?? !user.mfaEnabled,
    };
  }
}
