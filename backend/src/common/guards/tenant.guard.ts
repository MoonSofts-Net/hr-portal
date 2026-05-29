import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, TENANT_HEADER } from '../constants/metadata-keys';
import { AuthenticatedUser } from '../../security/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma/prisma.service';
import { DomainAuditService } from '../../modules/audit-logs/domain-audit.service';
import { getAuditContext, RequestWithContext } from '../middleware/request-context.middleware';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private audit: DomainAuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const req = context.switchToHttp().getRequest<RequestWithContext & { tenantId?: string; user?: AuthenticatedUser }>();
    const user = req.user;
    const headerTenant = req.headers[TENANT_HEADER] as string | undefined;
    const auditCtx = getAuditContext(req);

    if (!user) {
      if (isPublic) {
        if (headerTenant) req.tenantId = headerTenant;
        return true;
      }
      return true;
    }

    let activeTenantId = user.activeTenantId ?? user.homeTenantId;

    if (user.isGlobal || user.isSuperAdmin) {
      if (headerTenant) {
        const tenant = await this.prisma.tenant.findFirst({
          where: { id: headerTenant, isActive: true },
        });
        if (!tenant) {
          throw new ForbiddenException('Invalid tenant header');
        }
        activeTenantId = tenant.id;
      }
    } else if (headerTenant && headerTenant !== user.homeTenantId) {
      await this.audit.recordEvent('CROSS_TENANT_ACCESS_ATTEMPT', {
        tenantId: user.homeTenantId,
        actorUserId: user.userId,
        entityId: headerTenant,
        ipAddress: auditCtx.ipAddress,
        userAgent: auditCtx.userAgent,
        metadata: { attemptedTenantId: headerTenant },
      });
      throw new ForbiddenException('Cross-tenant access denied');
    } else {
      activeTenantId = user.homeTenantId;
    }

    req.tenantId = activeTenantId;
    user.activeTenantId = activeTenantId;
    user.tenantId = activeTenantId;

    await this.prisma.setTenantContext(activeTenantId);
    await this.prisma.setSuperAdminContext(user.isGlobal && user.isSuperAdmin);

    return true;
  }
}
