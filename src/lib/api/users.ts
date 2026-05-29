import { apiFetchPaginated, apiRequest, apiFetch, useMockApi, type RequestContext } from "./client";
import { MOCK_ROLES, MOCK_USERS } from "@/mocks/seed";
import type { PaginatedResult, User } from "@/types";

function toPaginated<T>(data: T[], page: number, limit: number, total: number): PaginatedResult<T> {
  return { data, total, page, pageSize: limit };
}

function mapApiUser(u: Record<string, unknown>): User {
  const status = String(u.status ?? "ACTIVE").toUpperCase();
  return {
    id: String(u.id),
    tenantId: String(u.tenantId),
    email: String(u.email),
    name: String(u.name),
    cpf: String(u.cpf ?? u.cpfMasked ?? ""),
    roleId: String((u.role as { id?: string })?.id ?? u.roleId ?? ""),
    roleName: String((u.role as { name?: string })?.name ?? u.roleName ?? ""),
    department: u.department ? String(u.department) : undefined,
    status:
      status === "ACTIVE" ? "active" : status === "DISABLED" || status === "SUSPENDED" ? "inactive" : "pending",
    avatarUrl: u.avatarUrl ? String(u.avatarUrl) : undefined,
    lastLoginAt: u.lastLoginAt ? String(u.lastLoginAt) : undefined,
    createdAt: String(u.createdAt ?? new Date().toISOString()),
  };
}

export async function getUsers(
  context: RequestContext,
  params?: { search?: string; page?: number; pageSize?: number }
): Promise<PaginatedResult<User>> {
  if (useMockApi()) {
    return apiRequest(() => {
      let data = MOCK_USERS.filter((u) => u.tenantId === context.tenantId);
      if (params?.search) {
        const q = params.search.toLowerCase();
        data = data.filter(
          (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        );
      }
      const page = params?.page ?? 1;
      const pageSize = params?.pageSize ?? 10;
      const start = (page - 1) * pageSize;
      return toPaginated(data.slice(start, start + pageSize), page, pageSize, data.length);
    }, context);
  }

  const page = params?.page ?? 1;
  const limit = params?.pageSize ?? 10;
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (params?.search) qs.set("search", params.search);

  const { data, meta } = await apiFetchPaginated<User[]>(`/users?${qs}`, { context });
  return {
    data: (data as unknown as Record<string, unknown>[]).map(mapApiUser),
    total: meta.total,
    page: meta.page,
    pageSize: meta.limit,
  };
}

export async function getUserById(id: string, context: RequestContext): Promise<User | null> {
  if (useMockApi()) {
    return apiRequest(() => {
      const user = MOCK_USERS.find((u) => u.id === id && u.tenantId === context.tenantId);
      return user ?? null;
    }, context);
  }

  try {
    const data = await apiFetch<Record<string, unknown>>(`/users/${id}`, { context });
    return mapApiUser(data);
  } catch {
    return null;
  }
}

export async function getRolesForTenant(context: RequestContext) {
  if (useMockApi()) {
    return apiRequest(() => {
      return MOCK_ROLES.filter((r) => r.tenantId === context.tenantId || r.tenantId === "*");
    }, context);
  }

  const { data } = await apiFetchPaginated<unknown[]>(`/roles?limit=100`, { context });
  return (data as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    tenantId: String(r.tenantId),
    name: String(r.name),
    description: String(r.description ?? ""),
    isSystem: Boolean(r.isSystem),
    permissionIds: (r.rolePermissions as { permissionId: string }[] | undefined)?.map(
      (rp) => rp.permissionId
    ) ?? [],
    createdAt: String(r.createdAt),
    updatedAt: String(r.updatedAt),
  }));
}
