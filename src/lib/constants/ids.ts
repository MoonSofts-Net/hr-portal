/**
 * IDs aligned with backend/prisma seed (backend/src/database/seed/seed.ts).
 * Use these in mock data so mock mode and API mode stay consistent.
 */
export const TENANT_MOONSOFTS_ID = "a0000000-0000-0000-0000-000000000002";

export const ROLE_SUPER_ADMIN_ID = "00000000-0000-0000-0000-000000000001";
export const ROLE_EMPLOYEE_ID = "00000000-0000-0000-0000-000000000002";
export const ROLE_HR_ID = "00000000-0000-0000-0000-000000000003";
export const ROLE_MANAGER_ID = "00000000-0000-0000-0000-000000000004";

/**
 * Standard UUID string shape (PostgreSQL / Nest @IsUUID).
 * Intentionally permissive so dev seed IDs (e.g. 00000000-0000-0000-0000-000000000003) validate.
 */
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}
