import { apiFetchPaginated, apiRequest, apiFetch, useMockApi, type RequestContext } from "./client";
import { MOCK_ROLES, MOCK_USERS, MOCK_BRANCHES } from "@/mocks/seed";
import { normalizeCpf } from "@/lib/utils/cpf";
import type { PaginatedResult, User } from "@/types";

function toPaginated<T>(data: T[], page: number, limit: number, total: number): PaginatedResult<T> {
  return { data, total, page, pageSize: limit };
}

function mapApiUser(u: Record<string, unknown>): User {
  const status = String(u.status ?? "ACTIVE").toUpperCase();
  const roleObj = u.role as { id?: string; name?: string } | null | undefined;
  const rolesArr = u.roles as { id: string; name: string }[] | undefined;
  const primaryRole = roleObj ?? rolesArr?.[0];
  const branchObj = u.branch as { id?: string; code?: string; name?: string } | null | undefined;
  return {
    id: String(u.id),
    tenantId: String(u.tenantId ?? ""),
    email: String(u.email),
    name: String(u.name),
    cpf: String(u.cpf ?? u.cpfMasked ?? ""),
    roleId: String(primaryRole?.id ?? u.roleId ?? ""),
    roleName: String(primaryRole?.name ?? u.roleName ?? ""),
    branchId: branchObj?.id ? String(branchObj.id) : u.branchId ? String(u.branchId) : undefined,
    branchName: branchObj?.name ? String(branchObj.name) : undefined,
    branchCode: branchObj?.code ? String(branchObj.code) : undefined,
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

export interface CreateUserInput {
  name: string;
  email: string;
  cpf: string;
  roleId: string;
  branchId: string;
  password?: string;
  department?: string;
  status: "active" | "inactive" | "pending";
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  cpf?: string;
  roleId?: string;
  branchId?: string;
  department?: string;
  status?: "active" | "inactive" | "pending";
  password?: string;
}

function mapStatusToApi(status: "active" | "inactive" | "pending"): string {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "inactive":
      return "DISABLED";
    default:
      return "INVITED";
  }
}

export async function createUser(
  context: RequestContext,
  input: CreateUserInput
): Promise<User> {
  if (useMockApi()) {
    return apiRequest(() => {
      const id = `user-${Date.now()}`;
      const role = MOCK_ROLES.find((r) => r.id === input.roleId);
      const branch = MOCK_BRANCHES.find((b) => b.id === input.branchId);
      const user: User = {
        id,
        tenantId: context.tenantId,
        email: input.email,
        name: input.name,
        cpf: input.cpf.replace(/\D/g, ""),
        roleId: input.roleId,
        roleName: role?.name ?? "Employee",
        branchId: input.branchId,
        branchName: branch?.name,
        branchCode: branch?.code,
        department: input.department,
        status: input.status,
        createdAt: new Date().toISOString(),
      };
      MOCK_USERS.push(user);
      return user;
    }, context);
  }

  const created = await apiFetch<Record<string, unknown>>("/users", {
    method: "POST",
    context,
    body: JSON.stringify({
      email: input.email,
      name: input.name,
      cpf: normalizeCpf(input.cpf),
      roleId: input.roleId,
      branchId: input.branchId,
      ...(input.password ? { password: input.password } : {}),
      department: input.department || undefined,
    }),
  });

  const user = mapApiUser(created);

  const targetStatus = mapStatusToApi(input.status);
  if (targetStatus !== "INVITED") {
    await apiFetch(`/users/${user.id}/status`, {
      method: "PATCH",
      context,
      body: JSON.stringify({ status: targetStatus }),
    });
    user.status = input.status;
  }

  return user;
}

export async function updateUser(
  context: RequestContext,
  id: string,
  input: UpdateUserInput
): Promise<User> {
  if (useMockApi()) {
    return apiRequest(() => {
      const idx = MOCK_USERS.findIndex((u) => u.id === id && u.tenantId === context.tenantId);
      if (idx === -1) throw new Error("User not found");
      const role = input.roleId
        ? MOCK_ROLES.find((r) => r.id === input.roleId)
        : undefined;
      MOCK_USERS[idx] = {
        ...MOCK_USERS[idx],
        ...input,
        roleName: role?.name ?? MOCK_USERS[idx].roleName,
      };
      return MOCK_USERS[idx];
    }, context);
  }

  const body: Record<string, unknown> = {};
  if (input.name) body.name = input.name;
  if (input.email) body.email = input.email;
  if (input.roleId) body.roleId = input.roleId;
  if (input.branchId) body.branchId = input.branchId;
  if (input.department !== undefined) body.department = input.department || undefined;
  if (input.password) body.password = input.password;

  if (Object.keys(body).length > 0) {
    await apiFetch(`/users/${id}`, {
      method: "PATCH",
      context,
      body: JSON.stringify(body),
    });
  }

  if (input.status) {
    await apiFetch(`/users/${id}/status`, {
      method: "PATCH",
      context,
      body: JSON.stringify({ status: mapStatusToApi(input.status) }),
    });
  }

  const refreshed = await getUserById(id, context);
  if (!refreshed) throw new Error("User not found after update");
  return refreshed;
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
