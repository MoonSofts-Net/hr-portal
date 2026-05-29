import { apiRequest, requestSecureDownloadUrl } from "./client";
import { MOCK_DOCUMENTS } from "@/mocks/seed";
import type { Document, DocumentCategory, PaginatedResult } from "@/types";
import type { RequestContext } from "./client";

export async function getDocuments(
  context: RequestContext,
  filters?: { category?: DocumentCategory; userId?: string }
): Promise<PaginatedResult<Document>> {
  return apiRequest(() => {
    let data = MOCK_DOCUMENTS.filter((d) => d.tenantId === context.tenantId);
    if (filters?.category) {
      data = data.filter((d) => d.category === filters.category);
    }
    if (filters?.userId) {
      data = data.filter((d) => d.userId === filters.userId);
    }
    return { data, total: data.length, page: 1, pageSize: data.length };
  }, context);
}

export { requestSecureDownloadUrl };
