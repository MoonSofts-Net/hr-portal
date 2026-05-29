/**
 * Helpers for tenant-scoped Prisma queries — single place to enforce tenantId filters.
 */
export function tenantWhere<T extends { tenantId?: string }>(
  tenantId: string,
  extra?: Omit<T, 'tenantId'>,
): T & { tenantId: string } {
  return { ...(extra as T), tenantId };
}

export function assertTenantMatch(
  resourceTenantId: string,
  requestTenantId: string,
): boolean {
  return resourceTenantId === requestTenantId;
}

export function assertSameTenantOrThrow(
  resourceTenantId: string,
  requestTenantId: string,
): void {
  if (!assertTenantMatch(resourceTenantId, requestTenantId)) {
    throw new Error('TENANT_MISMATCH');
  }
}
