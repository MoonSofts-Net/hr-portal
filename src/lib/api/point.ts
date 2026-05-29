import { apiRequest } from "./client";
import { MOCK_POINT_ADJUSTMENTS, MOCK_POINT_RECORDS } from "@/mocks/seed";
import type { PaginatedResult, PointAdjustmentRequest, PointRecord } from "@/types";
import type { RequestContext } from "./client";

export async function getPointRecords(
  context: RequestContext,
  userId?: string
): Promise<PointRecord[]> {
  return apiRequest(() => {
    const uid = userId ?? context.userId;
    return MOCK_POINT_RECORDS.filter(
      (p) => p.tenantId === context.tenantId && (!uid || p.userId === uid)
    );
  }, context);
}

export async function getPointAdjustments(
  context: RequestContext
): Promise<PaginatedResult<PointAdjustmentRequest>> {
  return apiRequest(() => {
    const data = MOCK_POINT_ADJUSTMENTS.filter(
      (a) => a.tenantId === context.tenantId
    );
    return { data, total: data.length, page: 1, pageSize: data.length };
  }, context);
}

export async function getPointAdjustmentById(
  id: string,
  context: RequestContext
): Promise<PointAdjustmentRequest | null> {
  return apiRequest(() => {
    return (
      MOCK_POINT_ADJUSTMENTS.find(
        (a) => a.id === id && a.tenantId === context.tenantId
      ) ?? null
    );
  }, context);
}
