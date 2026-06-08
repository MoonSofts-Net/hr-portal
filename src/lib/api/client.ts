import type { ApiError } from "@/types";
import { getApiBaseUrl, useMockApi } from "./config";

export interface RequestContext {
  tenantId: string;
  userId?: string;
}

export interface ApiListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: ApiListMeta;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  statusCode?: number;
  path?: string;
}

const TOKEN_KEY = "portal_rh_access_token";
const REFRESH_KEY = "portal_rh_refresh_token";
const ACTIVE_TENANT_KEY = "portal_rh_active_tenant";

const MOCK_DELAY_MS = 300;

export { useMockApi, getApiBaseUrl };

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getActiveTenantId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_TENANT_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string, activeTenantId?: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  if (activeTenantId) localStorage.setItem(ACTIVE_TENANT_KEY, activeTenantId);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(ACTIVE_TENANT_KEY);
}

/** Simulates network latency for mock API */
export async function apiRequest<T>(
  fn: () => T | Promise<T>,
  _context?: RequestContext
): Promise<T> {
  await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
  try {
    return await fn();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    throw { code: "API_ERROR", message } satisfies ApiError;
  }
}

function buildHeaders(context?: RequestContext, extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(extra as Record<string, string>),
  };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const tenantId = context?.tenantId ?? getActiveTenantId();
  if (tenantId) headers["x-tenant-id"] = tenantId;
  return headers;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { context?: RequestContext } = {}
): Promise<T> {
  const { context, ...init } = options;
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const isFormData = init.body instanceof FormData;
  const headers = buildHeaders(
    context,
    isFormData ? init.headers : { "Content-Type": "application/json", ...init.headers }
  );

  const res = await fetch(url, { ...init, headers });
  const json = (await res.json().catch(() => ({}))) as ApiSuccessResponse<T> | ApiErrorResponse;

  if (!res.ok || json.success === false) {
    const raw = json as ApiErrorResponse & { message?: string | string[] };
    let message: string;
    if (Array.isArray(raw.message)) {
      message = raw.message.join(", ");
    } else if (typeof raw.message === "string") {
      message = raw.message;
    } else {
      message = `Request failed (${res.status})`;
    }
    throw { code: "API_ERROR", message, statusCode: res.status } satisfies ApiError;
  }

  if (json.success === true) {
    return json.data;
  }

  return json as T;
}

export async function apiFetchPaginated<T>(
  path: string,
  options?: RequestInit & { context?: RequestContext }
): Promise<{ data: T; meta: ApiListMeta }> {
  const { context, ...init } = options ?? {};
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = buildHeaders(context, {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  });

  const res = await fetch(url, { ...init, headers });
  const json = (await res.json()) as (ApiSuccessResponse<T> & { meta?: ApiListMeta }) | ApiErrorResponse;

  if (!res.ok || ("success" in json && json.success === false)) {
    const err = json as ApiErrorResponse;
    throw {
      code: "API_ERROR",
      message: err.message ?? `Request failed (${res.status})`,
      statusCode: res.status,
    } satisfies ApiError;
  }

  const ok = json as ApiSuccessResponse<T> & { meta?: ApiListMeta };

  return {
    data: ok.data,
    meta: ok.meta ?? { page: 1, limit: 20, total: 0, totalPages: 0 },
  };
}

/** Document download — mock placeholder or signed URL from backend */
export async function requestSecureDownloadUrl(
  documentId: string,
  context: RequestContext
): Promise<{ url: string; expiresAt: string; filename?: string }> {
  if (useMockApi()) {
    return apiRequest(
      () => ({
        url: `/api/documents/${documentId}/download?tenant=${context.tenantId}`,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      }),
      context
    );
  }

  const data = await apiFetch<{
    downloadUrl: string;
    expiresAt: string;
    filename?: string;
  }>(`/documents/${documentId}/request-download-url`, {
    method: "POST",
    body: JSON.stringify({}),
    context,
  });
  return { url: data.downloadUrl, expiresAt: data.expiresAt, filename: data.filename };
}
