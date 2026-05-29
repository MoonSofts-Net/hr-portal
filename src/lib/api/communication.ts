import { apiRequest } from "./client";
import { MOCK_HR_REQUESTS } from "@/mocks/seed";
import type { HRRequest, HRRequestStatus, PaginatedResult } from "@/types";
import type { RequestContext } from "./client";

export async function getHRRequests(
  context: RequestContext,
  filters?: { status?: HRRequestStatus }
): Promise<PaginatedResult<HRRequest>> {
  return apiRequest(() => {
    let data = MOCK_HR_REQUESTS.filter((r) => r.tenantId === context.tenantId);
    if (filters?.status) {
      data = data.filter((r) => r.status === filters.status);
    }
    return { data, total: data.length, page: 1, pageSize: data.length };
  }, context);
}

export async function getHRRequestById(
  id: string,
  context: RequestContext
): Promise<HRRequest | null> {
  return apiRequest(() => {
    return (
      MOCK_HR_REQUESTS.find(
        (r) => r.id === id && r.tenantId === context.tenantId
      ) ?? null
    );
  }, context);
}
