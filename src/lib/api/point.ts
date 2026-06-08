import {
  apiFetch,
  apiFetchPaginated,
  apiRequest,
  useMockApi,
  type RequestContext,
} from "./client";
import { MOCK_POINT_ADJUSTMENTS, MOCK_POINT_RECORDS } from "@/mocks/seed";
import type {
  PaginatedResult,
  PointAdjustmentRequest,
  PointAdjustmentStatus,
  PointRecord,
} from "@/types";
import type { PointAdjustmentFormValues } from "@/lib/validation/requests";

const STATUS_FROM_BACKEND: Record<string, PointAdjustmentStatus> = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

function formatDateValue(value: unknown): string {
  if (!value) return "";
  const str = String(value);
  return str.includes("T") ? str.split("T")[0] : str;
}

function mapApiPointAdjustment(raw: Record<string, unknown>): PointAdjustmentRequest {
  const user = raw.user as { id?: string; name?: string } | undefined;
  const reviewedBy = raw.reviewedBy as { id?: string; name?: string } | null | undefined;

  return {
    id: String(raw.id),
    tenantId: String(raw.tenantId ?? ""),
    userId: String(raw.userId ?? user?.id ?? ""),
    userName: String(user?.name ?? "Unknown"),
    date: formatDateValue(raw.date),
    reason: String(raw.reason ?? ""),
    requestedChanges: String(raw.requestedChanges ?? ""),
    status: STATUS_FROM_BACKEND[String(raw.status ?? "PENDING")] ?? "pending",
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    reviewedAt: raw.reviewedAt ? String(raw.reviewedAt) : undefined,
    reviewedBy: reviewedBy?.name ? String(reviewedBy.name) : undefined,
    reviewComment: raw.reviewComment ? String(raw.reviewComment) : undefined,
  };
}

export async function getPointRecords(
  context: RequestContext,
  userId?: string
): Promise<PointRecord[]> {
  if (useMockApi()) {
    return apiRequest(() => {
      const uid = userId ?? context.userId;
      return MOCK_POINT_RECORDS.filter(
        (p) => p.tenantId === context.tenantId && (!uid || p.userId === uid)
      );
    }, context);
  }

  const path = userId ? `/point-records?userId=${userId}` : "/point-records/me";
  const data = await apiFetch<unknown[]>(path, { context });
  return (data as Record<string, unknown>[]).map((raw) => ({
    id: String(raw.id),
    tenantId: String(raw.tenantId ?? ""),
    userId: String(raw.userId ?? ""),
    date: formatDateValue(raw.date),
    entries: (raw.entries as PointRecord["entries"]) ?? [],
    totalHours: String(raw.totalHours ?? "0h"),
    status: String(raw.status ?? "NORMAL").toLowerCase() as PointRecord["status"],
  }));
}

export async function getPointAdjustments(
  context: RequestContext
): Promise<PaginatedResult<PointAdjustmentRequest>> {
  if (useMockApi()) {
    return apiRequest(() => {
      const data = MOCK_POINT_ADJUSTMENTS.filter((a) => a.tenantId === context.tenantId);
      return { data, total: data.length, page: 1, pageSize: data.length };
    }, context);
  }

  const { data, meta } = await apiFetchPaginated<unknown[]>(
    "/point-adjustments?page=1&limit=100",
    { context }
  );

  return {
    data: (data as Record<string, unknown>[]).map(mapApiPointAdjustment),
    total: meta.total,
    page: meta.page,
    pageSize: meta.limit,
  };
}

export async function getPointAdjustmentById(
  id: string,
  context: RequestContext
): Promise<PointAdjustmentRequest | null> {
  if (useMockApi()) {
    return apiRequest(() => {
      return (
        MOCK_POINT_ADJUSTMENTS.find(
          (a) => a.id === id && a.tenantId === context.tenantId
        ) ?? null
      );
    }, context);
  }

  try {
    const data = await apiFetch<Record<string, unknown>>(`/point-adjustments/${id}`, { context });
    return mapApiPointAdjustment(data);
  } catch {
    return null;
  }
}

export async function createPointAdjustment(
  context: RequestContext,
  input: PointAdjustmentFormValues
): Promise<PointAdjustmentRequest> {
  if (useMockApi()) {
    return apiRequest(() => {
      const item: PointAdjustmentRequest = {
        id: `adj-${Date.now()}`,
        tenantId: context.tenantId,
        userId: context.userId ?? "unknown",
        userName: "Current user",
        date: input.date,
        reason: input.reason,
        requestedChanges: input.requestedChanges,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      MOCK_POINT_ADJUSTMENTS.push(item);
      return item;
    }, context);
  }

  const data = await apiFetch<Record<string, unknown>>("/point-adjustments", {
    method: "POST",
    context,
    body: JSON.stringify({
      date: input.date,
      reason: input.reason,
      requestedChanges: input.requestedChanges,
    }),
  });

  return mapApiPointAdjustment(data);
}

export async function approvePointAdjustment(
  id: string,
  context: RequestContext
): Promise<PointAdjustmentRequest> {
  if (useMockApi()) {
    return apiRequest(() => {
      const item = MOCK_POINT_ADJUSTMENTS.find(
        (a) => a.id === id && a.tenantId === context.tenantId
      );
      if (!item) throw new Error("Adjustment not found");
      item.status = "approved";
      item.reviewedAt = new Date().toISOString();
      item.reviewedBy = "HR Reviewer";
      return item;
    }, context);
  }

  const data = await apiFetch<Record<string, unknown>>(`/point-adjustments/${id}/approve`, {
    method: "POST",
    context,
    body: JSON.stringify({}),
  });

  return mapApiPointAdjustment(data);
}

export async function rejectPointAdjustment(
  id: string,
  context: RequestContext,
  reviewComment: string
): Promise<PointAdjustmentRequest> {
  if (useMockApi()) {
    return apiRequest(() => {
      const item = MOCK_POINT_ADJUSTMENTS.find(
        (a) => a.id === id && a.tenantId === context.tenantId
      );
      if (!item) throw new Error("Adjustment not found");
      item.status = "rejected";
      item.reviewedAt = new Date().toISOString();
      item.reviewedBy = "HR Reviewer";
      item.reviewComment = reviewComment;
      return item;
    }, context);
  }

  const data = await apiFetch<Record<string, unknown>>(`/point-adjustments/${id}/reject`, {
    method: "POST",
    context,
    body: JSON.stringify({ reviewComment }),
  });

  return mapApiPointAdjustment(data);
}
