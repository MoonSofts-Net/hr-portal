import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, PERMISSIONS_KEY } from '../constants/metadata-keys';
import { AuthenticatedUser } from '../../security/interfaces/authenticated-user.interface';
import { PermissionsResolverService } from '../../modules/auth/services/permissions-resolver.service';

/**
 * Dynamic RBAC — evaluates @RequirePermissions() against JWT-resolved permission IDs.
 * Backend is the source of truth; frontend checks are UX-only.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsResolver: PermissionsResolverService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const user = context.switchToHttp().getRequest().user as AuthenticatedUser | undefined;
    if (!user) throw new ForbiddenException('Authentication required');

    if (!user.mfaVerified && user.mfaEnabled) {
      throw new ForbiddenException('MFA verification required');
    }

    const allowed = this.permissionsResolver.hasAny(required, user.permissionIds);
    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
