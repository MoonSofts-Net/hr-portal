import {
  apiFetch,
  apiFetchPaginated,
  apiRequest,
  useMockApi,
  type RequestContext,
} from "./client";
import { MOCK_DOCUMENT_TYPES, MOCK_ONBOARDING } from "@/mocks/seed";
import type {
  DocumentTypeConfig,
  DocumentUploadStatus,
  OnboardingStatus,
  OnboardingSubmission,
  PaginatedResult,
} from "@/types";

const ONBOARDING_STATUS_FROM_BACKEND: Record<string, OnboardingStatus> = {
  DRAFT: "in_progress",
  SUBMITTED: "submitted",
  IN_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "rejected",
};

const DOCUMENT_STATUS_FROM_BACKEND: Record<string, DocumentUploadStatus> = {
  PENDING: "pending",
  SUBMITTED: "submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXPIRED: "rejected",
};

function mapApiOnboarding(raw: Record<string, unknown>): OnboardingSubmission {
  const user = raw.user as { id?: string; name?: string } | undefined;
  const reviewedBy = raw.reviewedBy as { name?: string } | undefined;
  const submissions = raw.submissions as Record<string, unknown>[] | undefined;

  const documents =
    submissions?.map((sub) => {
      const requirement = sub.requirement as { id?: string; label?: string; code?: string } | undefined;
      const document = sub.document as { id?: string } | undefined;
      return {
        documentTypeId: String(requirement?.id ?? sub.requirementId ?? ""),
        documentTypeLabel: String(requirement?.label ?? requirement?.code ?? "Document"),
        status: DOCUMENT_STATUS_FROM_BACKEND[String(sub.status ?? "PENDING")] ?? "pending",
        documentId: document?.id ? String(document.id) : undefined,
        rejectionReason: sub.rejectionReason ? String(sub.rejectionReason) : undefined,
      };
    }) ?? [];

  const status =
    ONBOARDING_STATUS_FROM_BACKEND[String(raw.status ?? "DRAFT")] ?? "in_progress";

  return {
    id: String(raw.id),
    tenantId: String(raw.tenantId ?? ""),
    userId: String(raw.userId ?? user?.id ?? ""),
    userName: String(user?.name ?? "Unknown"),
    status,
    progressPercent: Number(raw.progressPercent ?? 0),
    submittedAt: raw.submittedAt ? String(raw.submittedAt) : undefined,
    reviewedAt: raw.reviewedAt ? String(raw.reviewedAt) : undefined,
    reviewedBy: reviewedBy?.name ? String(reviewedBy.name) : undefined,
    rejectionReason: raw.rejectionReason ? String(raw.rejectionReason) : undefined,
    personalInfo: {
      fullName: String(user?.name ?? ""),
      birthDate: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
    },
    documents,
    timeline: [],
  };
}

export async function getOnboardingList(
  context: RequestContext
): Promise<PaginatedResult<OnboardingSubmission>> {
  if (useMockApi()) {
    return apiRequest(() => {
      const data = MOCK_ONBOARDING.filter((o) => o.tenantId === context.tenantId);
      return { data, total: data.length, page: 1, pageSize: data.length };
    }, context);
  }

  const { data, meta } = await apiFetchPaginated<unknown[]>(
    "/onboarding?page=1&limit=100",
    { context }
  );

  return {
    data: (data as Record<string, unknown>[]).map(mapApiOnboarding),
    total: meta.total,
    page: meta.page,
    pageSize: meta.limit,
  };
}

export async function getOnboardingById(
  id: string,
  context: RequestContext
): Promise<OnboardingSubmission | null> {
  if (useMockApi()) {
    return apiRequest(() => {
      return (
        MOCK_ONBOARDING.find(
          (o) => o.id === id && o.tenantId === context.tenantId
        ) ?? null
      );
    }, context);
  }

  try {
    const data = await apiFetch<Record<string, unknown>>(`/onboarding/${id}`, { context });
    return mapApiOnboarding(data);
  } catch {
    return null;
  }
}

export async function approveOnboarding(
  id: string,
  context: RequestContext
): Promise<OnboardingSubmission> {
  if (useMockApi()) {
    return apiRequest(() => {
      const item = MOCK_ONBOARDING.find(
        (o) => o.id === id && o.tenantId === context.tenantId
      );
      if (!item) throw new Error("Onboarding not found");
      item.status = "approved";
      item.reviewedAt = new Date().toISOString();
      return item;
    }, context);
  }

  const data = await apiFetch<Record<string, unknown>>(`/onboarding/${id}/approve`, {
    method: "POST",
    context,
    body: JSON.stringify({}),
  });
  return mapApiOnboarding(data);
}

export async function rejectOnboarding(
  id: string,
  context: RequestContext,
  rejectionReason: string
): Promise<OnboardingSubmission> {
  if (useMockApi()) {
    return apiRequest(() => {
      const item = MOCK_ONBOARDING.find(
        (o) => o.id === id && o.tenantId === context.tenantId
      );
      if (!item) throw new Error("Onboarding not found");
      item.status = "rejected";
      item.rejectionReason = rejectionReason;
      item.reviewedAt = new Date().toISOString();
      return item;
    }, context);
  }

  const data = await apiFetch<Record<string, unknown>>(`/onboarding/${id}/reject`, {
    method: "POST",
    context,
    body: JSON.stringify({ rejectionReason }),
  });
  return mapApiOnboarding(data);
}

export async function getDocumentTypes(
  context: RequestContext
): Promise<DocumentTypeConfig[]> {
  return apiRequest(
    () => MOCK_DOCUMENT_TYPES.filter((d) => d.tenantId === context.tenantId),
    context
  );
}
