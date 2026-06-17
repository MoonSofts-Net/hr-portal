import { apiFetch, apiFetchPaginated, apiRequest, useMockApi, type RequestContext } from "./client";
import { MOCK_BRANCHES } from "@/mocks/seed";
import type { Branch, PaginatedResult } from "@/types";

function mapBranch(b: Record<string, unknown>): Branch {
  return {
    id: String(b.id),
    tenantId: String(b.tenantId),
    code: String(b.code),
    name: String(b.name),
    legalName: b.legalName ? String(b.legalName) : undefined,
    taxId: b.taxId ? String(b.taxId) : undefined,
    address: b.address ? String(b.address) : undefined,
    city: b.city ? String(b.city) : undefined,
    state: b.state ? String(b.state) : undefined,
    isContracted: Boolean(b.isContracted ?? true),
    isActive: Boolean(b.isActive ?? true),
    userCount: b.userCount !== undefined ? Number(b.userCount) : undefined,
    createdAt: String(b.createdAt ?? new Date().toISOString()),
    updatedAt: b.updatedAt ? String(b.updatedAt) : undefined,
  };
}

export async function getBranches(
  context: RequestContext,
  params?: { search?: string; page?: number; pageSize?: number; activeOnly?: boolean }
): Promise<PaginatedResult<Branch>> {
  if (useMockApi()) {
    return apiRequest(() => {
      let data = MOCK_BRANCHES.filter((b) => b.tenantId === context.tenantId);
      if (params?.activeOnly) data = data.filter((b) => b.isActive);
      if (params?.search) {
        const q = params.search.toLowerCase();
        data = data.filter(
          (b) =>
            b.name.toLowerCase().includes(q) ||
            b.code.toLowerCase().includes(q) ||
            b.city?.toLowerCase().includes(q)
        );
      }
      const page = params?.page ?? 1;
      const pageSize = params?.pageSize ?? 100;
      const start = (page - 1) * pageSize;
      return {
        data: data.slice(start, start + pageSize),
        total: data.length,
        page,
        pageSize,
      };
    }, context);
  }

  const page = params?.page ?? 1;
  const limit = params?.pageSize ?? 100;
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (params?.search) qs.set("search", params.search);
  if (params?.activeOnly) qs.set("isActive", "true");

  const { data, meta } = await apiFetchPaginated<unknown[]>(`/branches?${qs}`, { context });
  return {
    data: (data as Record<string, unknown>[]).map(mapBranch),
    total: meta.total,
    page: meta.page,
    pageSize: meta.limit,
  };
}

export async function getBranchById(id: string, context: RequestContext): Promise<Branch | null> {
  if (useMockApi()) {
    return apiRequest(() => {
      const branch = MOCK_BRANCHES.find((b) => b.id === id && b.tenantId === context.tenantId);
      return branch ?? null;
    }, context);
  }

  try {
    const data = await apiFetch<Record<string, unknown>>(`/branches/${id}`, { context });
    return mapBranch(data);
  } catch {
    return null;
  }
}

export interface CreateBranchInput {
  code: string;
  name: string;
  legalName?: string;
  taxId?: string;
  address?: string;
  city?: string;
  state?: string;
  isContracted?: boolean;
  isActive?: boolean;
}

export type UpdateBranchInput = Partial<CreateBranchInput>;

export async function createBranch(context: RequestContext, input: CreateBranchInput): Promise<Branch> {
  if (useMockApi()) {
    return apiRequest(() => {
      const branch: Branch = {
        id: `branch-${Date.now()}`,
        tenantId: context.tenantId,
        code: input.code.trim().toUpperCase(),
        name: input.name.trim(),
        legalName: input.legalName,
        taxId: input.taxId,
        address: input.address,
        city: input.city,
        state: input.state,
        isContracted: input.isContracted ?? true,
        isActive: input.isActive ?? true,
        userCount: 0,
        createdAt: new Date().toISOString(),
      };
      MOCK_BRANCHES.push(branch);
      return branch;
    }, context);
  }

  const created = await apiFetch<Record<string, unknown>>("/branches", {
    method: "POST",
    context,
    body: JSON.stringify({
      ...input,
      code: input.code.trim().toUpperCase(),
    }),
  });
  return mapBranch(created);
}

export async function updateBranch(
  context: RequestContext,
  id: string,
  input: UpdateBranchInput
): Promise<Branch> {
  if (useMockApi()) {
    return apiRequest(() => {
      const idx = MOCK_BRANCHES.findIndex((b) => b.id === id && b.tenantId === context.tenantId);
      if (idx === -1) throw new Error("Branch not found");
      MOCK_BRANCHES[idx] = {
        ...MOCK_BRANCHES[idx],
        ...input,
        code: input.code?.trim().toUpperCase() ?? MOCK_BRANCHES[idx].code,
        updatedAt: new Date().toISOString(),
      };
      return MOCK_BRANCHES[idx];
    }, context);
  }

  const updated = await apiFetch<Record<string, unknown>>(`/branches/${id}`, {
    method: "PATCH",
    context,
    body: JSON.stringify(input),
  });
  return mapBranch(updated);
}

export async function deactivateBranch(context: RequestContext, id: string): Promise<Branch> {
  if (useMockApi()) {
    return updateBranch(context, id, { isActive: false });
  }

  const updated = await apiFetch<Record<string, unknown>>(`/branches/${id}`, {
    method: "DELETE",
    context,
  });
  return mapBranch(updated);
}
