import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Effective tenant ID for the current request (after TenantGuard).
 * Alias: getCurrentTenant()
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId ?? request.user?.activeTenantId;
  },
);

export const getCurrentTenant = CurrentTenant;
