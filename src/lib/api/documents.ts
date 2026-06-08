import {
  apiFetch,
  apiFetchPaginated,
  apiRequest,
  requestSecureDownloadUrl,
  useMockApi,
  type RequestContext,
} from "./client";
import { MOCK_DOCUMENTS } from "@/mocks/seed";
import type { Document, DocumentCategory, DocumentUploadStatus, PaginatedResult } from "@/types";

const CATEGORY_TO_BACKEND: Record<DocumentCategory, string> = {
  personal: "PERSONAL_DOCUMENT",
  contracts: "CONTRACT",
  payslips: "PAYSLIP",
  internal: "INTERNAL_COMMUNICATION",
  other: "OTHER",
};

const CATEGORY_FROM_BACKEND: Record<string, DocumentCategory> = {
  PERSONAL_DOCUMENT: "personal",
  CONTRACT: "contracts",
  PAYSLIP: "payslips",
  INTERNAL_COMMUNICATION: "internal",
  ONBOARDING: "personal",
  OTHER: "other",
};

const STATUS_FROM_BACKEND: Record<string, DocumentUploadStatus> = {
  PENDING: "pending",
  SUBMITTED: "submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXPIRED: "rejected",
};

const ACCESS_FROM_BACKEND: Record<string, Document["accessLevel"]> = {
  PRIVATE: "private",
  HR: "hr",
  MANAGER: "manager",
  COMPANY: "company",
};

function mapApiDocument(raw: Record<string, unknown>): Document {
  const status = String(raw.status ?? "SUBMITTED");
  const category = String(raw.category ?? "OTHER");
  return {
    id: String(raw.id),
    tenantId: String(raw.tenantId ?? ""),
    userId: String(raw.userId ?? ""),
    name: String(raw.name ?? ""),
    category: CATEGORY_FROM_BACKEND[category] ?? "other",
    version: Number(raw.currentVersion ?? raw.version ?? 1),
    status: STATUS_FROM_BACKEND[status] ?? "submitted",
    uploadedAt: String(raw.uploadedAt ?? raw.createdAt ?? new Date().toISOString()),
    rejectionReason: raw.rejectionReason ? String(raw.rejectionReason) : undefined,
    accessLevel: ACCESS_FROM_BACKEND[String(raw.accessLevel ?? "PRIVATE")] ?? "private",
  };
}

export async function getDocuments(
  context: RequestContext,
  filters?: { category?: DocumentCategory; userId?: string }
): Promise<PaginatedResult<Document>> {
  if (useMockApi()) {
    return apiRequest(() => {
      let data = MOCK_DOCUMENTS.filter((d) => d.tenantId === context.tenantId);
      if (filters?.category) data = data.filter((d) => d.category === filters.category);
      if (filters?.userId) data = data.filter((d) => d.userId === filters.userId);
      return { data, total: data.length, page: 1, pageSize: data.length };
    }, context);
  }

  const qs = new URLSearchParams({ page: "1", limit: "100" });
  if (filters?.category) qs.set("category", CATEGORY_TO_BACKEND[filters.category]);
  if (filters?.userId) qs.set("userId", filters.userId);

  const { data, meta } = await apiFetchPaginated<unknown[]>(`/documents?${qs}`, { context });
  return {
    data: (data as Record<string, unknown>[]).map(mapApiDocument),
    total: meta.total,
    page: meta.page,
    pageSize: meta.limit,
  };
}

export interface UploadDocumentInput {
  file: File;
  name: string;
  category: DocumentCategory;
}

export async function uploadDocument(
  context: RequestContext,
  input: UploadDocumentInput
): Promise<Document> {
  if (useMockApi()) {
    return apiRequest(() => {
      const doc: Document = {
        id: `doc-${Date.now()}`,
        tenantId: context.tenantId,
        userId: context.userId ?? "unknown",
        name: input.name,
        category: input.category,
        version: 1,
        status: "submitted",
        uploadedAt: new Date().toISOString(),
        accessLevel: "private",
      };
      MOCK_DOCUMENTS.push(doc);
      return doc;
    }, context);
  }

  const form = new FormData();
  form.append("file", input.file);
  form.append("category", CATEGORY_TO_BACKEND[input.category]);
  form.append("name", input.name);

  const created = await apiFetch<Record<string, unknown>>("/documents/upload", {
    method: "POST",
    context,
    body: form,
  });

  return mapApiDocument(created);
}

export { requestSecureDownloadUrl };

export async function downloadDocument(
  doc: Document,
  context: RequestContext
): Promise<void> {
  const { url, filename } = await requestSecureDownloadUrl(doc.id, context);
  const downloadName = filename ?? doc.name;

  if (useMockApi()) {
    throw { code: "API_ERROR", message: "Download is not available in mock mode" };
  }

  const response = await fetch(url);

  if (!response.ok) {
    let message = `Download failed (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // ignore parse errors
    }
    throw { code: "API_ERROR", message, statusCode: response.status };
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = downloadName;
  anchor.rel = "noopener";
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(blobUrl);
}
