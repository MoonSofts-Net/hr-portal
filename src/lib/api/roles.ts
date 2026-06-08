import {
  apiFetch,
  apiFetchPaginated,
  apiRequest,
  useMockApi,
  type RequestContext,
} from "./client";
import { MOCK_ROLES } from "@/mocks/seed";
import { PERMISSION_DEFINITIONS } from "@/lib/permissions/definitions";
import type { PaginatedResult, Permission, Role } from "@/types";
import type { RoleFormValues } from "@/lib/validation/role";

function mapApiRole(raw: Record<string, unknown>): Role {
  const rolePermissions = raw.rolePermissions as
    | { permissionId: string; permission?: { id: string } }[]
    | undefined;
  const permissionIds =
    rolePermissions?.map((rp) => rp.permissionId ?? rp.permission?.id).filter(Boolean) as string[] ??
    [];

  return {
    id: String(raw.id),
    tenantId: String(raw.tenantId ?? ""),
    name: String(raw.name),
    description: String(raw.description ?? ""),
    isSystem: Boolean(raw.isSystem),
    permissionIds,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  };
}

export async function getRoles(
  context: RequestContext,
  params?: { page?: number; pageSize?: number }
): Promise<PaginatedResult<Role>> {
  if (useMockApi()) {
    return apiRequest(() => {
      const data = MOCK_ROLES.filter(
        (r) => r.tenantId === context.tenantId || r.tenantId === "*"
      );
      return { data, total: data.length, page: 1, pageSize: data.length };
    }, context);
  }

  const page = params?.page ?? 1;
  const limit = params?.pageSize ?? 100;
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });

  const { data, meta } = await apiFetchPaginated<unknown[]>(`/roles?${qs}`, { context });
  return {
    data: (data as Record<string, unknown>[]).map(mapApiRole),
    total: meta.total,
    page: meta.page,
    pageSize: meta.limit,
  };
}

export async function getRoleById(
  id: string,
  context: RequestContext
): Promise<Role | null> {
  if (useMockApi()) {
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

  try {
    const data = await apiFetch<Record<string, unknown>>(`/roles/${id}`, { context });
    return mapApiRole(data);
  } catch {
    return null;
  }
}

export async function createRole(
  context: RequestContext,
  input: RoleFormValues
): Promise<Role> {
  if (useMockApi()) {
    return apiRequest(() => {
      const role: Role = {
        id: `role-${Date.now()}`,
        tenantId: context.tenantId,
        name: input.name,
        description: input.description ?? "",
        isSystem: false,
        permissionIds: input.permissionIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_ROLES.push(role);
      return role;
    }, context);
  }

  const created = await apiFetch<Record<string, unknown>>("/roles", {
    method: "POST",
    context,
    body: JSON.stringify({
      name: input.name,
      description: input.description || undefined,
    }),
  });

  const roleId = String(created.id);

  await apiFetch(`/roles/${roleId}/permissions`, {
    method: "POST",
    context,
    body: JSON.stringify({ permissionIds: input.permissionIds }),
  });

  const role = await getRoleById(roleId, context);
  if (!role) throw new Error("Role not found after creation");
  return role;
}

export async function updateRole(
  context: RequestContext,
  id: string,
  input: RoleFormValues
): Promise<Role> {
  if (useMockApi()) {
    return apiRequest(() => {
      const idx = MOCK_ROLES.findIndex(
        (r) => r.id === id && (r.tenantId === context.tenantId || r.tenantId === "*")
      );
      if (idx === -1) throw new Error("Role not found");
      MOCK_ROLES[idx] = {
        ...MOCK_ROLES[idx],
        name: input.name,
        description: input.description ?? "",
        permissionIds: input.permissionIds,
        updatedAt: new Date().toISOString(),
      };
      return MOCK_ROLES[idx];
    }, context);
  }

  await apiFetch(`/roles/${id}`, {
    method: "PATCH",
    context,
    body: JSON.stringify({
      name: input.name,
      description: input.description || undefined,
    }),
  });

  await apiFetch(`/roles/${id}/permissions`, {
    method: "POST",
    context,
    body: JSON.stringify({ permissionIds: input.permissionIds }),
  });

  const role = await getRoleById(id, context);
  if (!role) throw new Error("Role not found after update");
  return role;
}

export async function getAllPermissions(): Promise<Permission[]> {
  return apiRequest(() => PERMISSION_DEFINITIONS);
}
