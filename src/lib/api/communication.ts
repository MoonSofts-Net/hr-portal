import {
  apiFetch,
  apiFetchPaginated,
  apiRequest,
  useMockApi,
  type RequestContext,
} from "./client";
import { MOCK_HR_REQUESTS } from "@/mocks/seed";
import type { HRRequest, HRRequestMessage, HRRequestStatus, PaginatedResult, ApiError } from "@/types";
import type { HRRequestFormValues } from "@/lib/validation/requests";

const STATUS_TO_BACKEND: Record<HRRequestStatus, string> = {
  open: "OPEN",
  in_progress: "IN_PROGRESS",
  waiting_employee: "WAITING_EMPLOYEE",
  resolved: "RESOLVED",
  closed: "CLOSED",
};

const STATUS_FROM_BACKEND: Record<string, HRRequestStatus> = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  WAITING_EMPLOYEE: "waiting_employee",
  RESOLVED: "resolved",
  CLOSED: "closed",
};

const PRIORITY_TO_BACKEND: Record<HRRequestFormValues["priority"], string> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
};

const PRIORITY_FROM_BACKEND: Record<string, HRRequest["priority"]> = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

function mapApiMessage(raw: Record<string, unknown>): HRRequestMessage {
  const author = raw.author as { id?: string; name?: string } | undefined;
  return {
    id: String(raw.id),
    authorId: String(raw.authorId ?? author?.id ?? ""),
    authorName: String(author?.name ?? "Unknown"),
    body: String(raw.body ?? ""),
    isInternal: Boolean(raw.isInternal),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

function mapApiHRRequest(raw: Record<string, unknown>): HRRequest {
  const requester = raw.requester as { id?: string; name?: string } | undefined;
  const assignee = raw.assignee as { id?: string; name?: string } | undefined;
  const messagesRaw = raw.messages as Record<string, unknown>[] | undefined;

  return {
    id: String(raw.id),
    tenantId: String(raw.tenantId ?? ""),
    requesterId: String(raw.requesterId ?? requester?.id ?? ""),
    requesterName: String(requester?.name ?? "Unknown"),
    subject: String(raw.subject ?? ""),
    category: String(raw.category ?? ""),
    status: STATUS_FROM_BACKEND[String(raw.status ?? "OPEN")] ?? "open",
    priority: PRIORITY_FROM_BACKEND[String(raw.priority ?? "MEDIUM")] ?? "medium",
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
    assignedTo: assignee?.name ? String(assignee.name) : undefined,
    messages: messagesRaw?.map(mapApiMessage) ?? [],
  };
}

export async function getHRRequests(
  context: RequestContext,
  filters?: { status?: HRRequestStatus }
): Promise<PaginatedResult<HRRequest>> {
  if (useMockApi()) {
    return apiRequest(() => {
      let data = MOCK_HR_REQUESTS.filter((r) => r.tenantId === context.tenantId);
      if (filters?.status) data = data.filter((r) => r.status === filters.status);
      return { data, total: data.length, page: 1, pageSize: data.length };
    }, context);
  }

  const qs = new URLSearchParams({ page: "1", limit: "100" });
  if (filters?.status) qs.set("status", STATUS_TO_BACKEND[filters.status]);

  const { data, meta } = await apiFetchPaginated<unknown[]>(`/hr-requests?${qs}`, { context });
  return {
    data: (data as Record<string, unknown>[]).map(mapApiHRRequest),
    total: meta.total,
    page: meta.page,
    pageSize: meta.limit,
  };
}

export async function getHRRequestById(
  id: string,
  context: RequestContext
): Promise<HRRequest | null> {
  if (useMockApi()) {
    return apiRequest(() => {
      return (
        MOCK_HR_REQUESTS.find(
          (r) => r.id === id && r.tenantId === context.tenantId
        ) ?? null
      );
    }, context);
  }

  if (!context.tenantId) {
    throw { code: "API_ERROR", message: "Tenant context is missing" } satisfies ApiError;
  }

  try {
    const data = await apiFetch<Record<string, unknown>>(`/hr-requests/${id}`, { context });
    return mapApiHRRequest(data);
  } catch (err) {
    const apiErr = err as ApiError;
    if (apiErr.statusCode === 404) return null;
    throw err;
  }
}

export async function createHRRequest(
  context: RequestContext,
  input: HRRequestFormValues
): Promise<HRRequest> {
  if (useMockApi()) {
    return apiRequest(() => {
      const request: HRRequest = {
        id: `req-${Date.now()}`,
        tenantId: context.tenantId,
        requesterId: context.userId ?? "unknown",
        requesterName: "Current user",
        subject: input.subject,
        category: input.category,
        status: "open",
        priority: input.priority,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: `msg-${Date.now()}`,
            authorId: context.userId ?? "unknown",
            authorName: "Current user",
            body: input.body,
            isInternal: false,
            createdAt: new Date().toISOString(),
          },
        ],
      };
      MOCK_HR_REQUESTS.push(request);
      return request;
    }, context);
  }

  if (!context.tenantId) {
    throw { code: "API_ERROR", message: "Tenant context is missing. Please sign in again." } satisfies ApiError;
  }

  const data = await apiFetch<Record<string, unknown>>("/hr-requests", {
    method: "POST",
    context,
    body: JSON.stringify({
      subject: input.subject.trim(),
      category: input.category,
      priority: PRIORITY_TO_BACKEND[input.priority],
      initialMessage: input.body.trim(),
    }),
  });

  return mapApiHRRequest(data);
}

export async function updateHRRequestStatus(
  context: RequestContext,
  requestId: string,
  status: HRRequestStatus
): Promise<HRRequest> {
  if (useMockApi()) {
    return apiRequest(() => {
      const request = MOCK_HR_REQUESTS.find(
        (r) => r.id === requestId && r.tenantId === context.tenantId
      );
      if (!request) throw new Error("Request not found");
      request.status = status;
      request.updatedAt = new Date().toISOString();
      return request;
    }, context);
  }

  await apiFetch(`/hr-requests/${requestId}/status`, {
    method: "PATCH",
    context,
    body: JSON.stringify({ status: STATUS_TO_BACKEND[status] }),
  });

  const refreshed = await getHRRequestById(requestId, context);
  if (!refreshed) throw new Error("Request not found after status update");
  return refreshed;
}

export async function addHRRequestMessage(
  context: RequestContext,
  requestId: string,
  body: string,
  isInternal = false
): Promise<HRRequest> {
  if (useMockApi()) {
    return apiRequest(() => {
      const request = MOCK_HR_REQUESTS.find(
        (r) => r.id === requestId && r.tenantId === context.tenantId
      );
      if (!request) throw new Error("Request not found");
      request.messages.push({
        id: `msg-${Date.now()}`,
        authorId: context.userId ?? "unknown",
        authorName: "Current user",
        body,
        isInternal,
        createdAt: new Date().toISOString(),
      });
      request.updatedAt = new Date().toISOString();
      return request;
    }, context);
  }

  await apiFetch(`/hr-requests/${requestId}/messages`, {
    method: "POST",
    context,
    body: JSON.stringify({ body, isInternal }),
  });

  const refreshed = await getHRRequestById(requestId, context);
  if (!refreshed) throw new Error("Request not found after reply");
  return refreshed;
}
