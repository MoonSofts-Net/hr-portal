import { apiRequest } from "./client";
import { MOCK_ROLES } from "@/mocks/seed";
import { PERMISSION_DEFINITIONS } from "@/lib/permissions/definitions";
import type { PaginatedResult, Role } from "@/types";
import type { RequestContext } from "./client";

export async function getRoles(
  context: RequestContext
): Promise<PaginatedResult<Role>> {
  return apiRequest(() => {
    const data = MOCK_ROLES.filter(
      (r) => r.tenantId === context.tenantId || r.tenantId === "*"
    );
    return { data, total: data.length, page: 1, pageSize: data.length };
  }, context);
}

export async function getRoleById(
  id: string,
  context: RequestContext
): Promise<Role | null> {
  return apiRequest(() => {
    return (
      MOCK_ROLES.find(
        (r) =>
          r.id === id &&
          (r.tenantId === context.tenantId || r.tenantId === "*")
      ) ?? null
    );
  }, context);
}

export async function getAllPermissions() {
  return apiRequest(() => PERMISSION_DEFINITIONS);
}
