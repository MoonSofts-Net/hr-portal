import { apiRequest } from "./client";
import { MOCK_DOCUMENT_TYPES, MOCK_ONBOARDING } from "@/mocks/seed";
import type { DocumentTypeConfig, OnboardingSubmission, PaginatedResult } from "@/types";
import type { RequestContext } from "./client";

export async function getOnboardingList(
  context: RequestContext
): Promise<PaginatedResult<OnboardingSubmission>> {
  return apiRequest(() => {
    const data = MOCK_ONBOARDING.filter((o) => o.tenantId === context.tenantId);
    return { data, total: data.length, page: 1, pageSize: data.length };
  }, context);
}

export async function getOnboardingById(
  id: string,
  context: RequestContext
): Promise<OnboardingSubmission | null> {
  return apiRequest(() => {
    return (
      MOCK_ONBOARDING.find(
        (o) => o.id === id && o.tenantId === context.tenantId
      ) ?? null
    );
  }, context);
}

export async function getDocumentTypes(
  context: RequestContext
): Promise<DocumentTypeConfig[]> {
  return apiRequest(
    () => MOCK_DOCUMENT_TYPES.filter((d) => d.tenantId === context.tenantId),
    context
  );
}
