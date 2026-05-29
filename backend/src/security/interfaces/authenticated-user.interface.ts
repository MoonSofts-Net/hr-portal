/**
 * Request-scoped principal after JWT validation.
 * `tenantId` / `activeTenantId` = effective tenant for queries (may differ for global operators).
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
  /** User's home tenant (membership). */
  homeTenantId: string;
  /** Effective tenant for this request (JWT + TenantGuard). */
  activeTenantId: string;
  /** @deprecated Use activeTenantId — kept for backward compatibility */
  tenantId: string;
  roleId: string;
  roleName: string;
  sessionId: string;
  permissionIds: string[];
  isSuperAdmin: boolean;
  isGlobal: boolean;
  mfaEnabled: boolean;
  mfaVerified: boolean;
}
