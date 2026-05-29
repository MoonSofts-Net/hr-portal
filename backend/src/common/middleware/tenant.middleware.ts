import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TENANT_HEADER } from '../constants/metadata-keys';
import { AuthenticatedUser } from '../../security/interfaces/authenticated-user.interface';

/**
 * Resolves tenant context for each request.
 * - Authenticated: tenant from JWT (header must match unless super admin)
 * - Public routes: optional header for login scoping
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request & { tenantId?: string; user?: AuthenticatedUser }, _res: Response, next: NextFunction) {
    const headerTenant = req.headers[TENANT_HEADER] as string | undefined;
    const user = req.user;

    if (user) {
      if (headerTenant && headerTenant !== user.tenantId && !user.isSuperAdmin) {
        throw new ForbiddenException('Cross-tenant access denied');
      }
      req.tenantId = user.tenantId;
      return next();
    }

    if (headerTenant) {
      req.tenantId = headerTenant;
      return next();
    }

    // Public auth endpoints may omit tenant until login resolves it
    if (req.path.includes('/auth/login') || req.path.includes('/health')) {
      return next();
    }

    // For other public routes, tenant may be required later in handlers
    next();
  }
}
