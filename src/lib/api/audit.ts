import { apiRequest } from "./client";
import { MOCK_AUDIT_LOGS } from "@/mocks/seed";
import type { AuditLog, PaginatedResult, PermissionModule } from "@/types";
import type { RequestContext } from "./client";
import type { AuditAction } from "@/types";

export interface AuditFilters {
  userId?: string;
  module?: PermissionModule | "auth";
  action?: AuditAction;
  dateFrom?: string;
  dateTo?: string;
  tenantId?: string;
}

export async function getAuditLogs(
  context: RequestContext,
  filters?: AuditFilters
): Promise<PaginatedResult<AuditLog>> {
  return apiRequest(() => {
    let data = [...MOCK_AUDIT_LOGS];
    if (filters?.tenantId) {
      data = data.filter((l) => l.tenantId === filters.tenantId);
    } else if (context.tenantId !== "*") {
      data = data.filter((l) => l.tenantId === context.tenantId);
    }
    if (filters?.userId) {
      data = data.filter((l) => l.userId === filters.userId);
    }
    if (filters?.module) {
      data = data.filter((l) => l.module === filters.module);
    }
    if (filters?.action) {
      data = data.filter((l) => l.action === filters.action);
    }
    return { data, total: data.length, page: 1, pageSize: data.length };
  }, context);
}
