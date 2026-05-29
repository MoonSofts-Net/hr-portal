"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "@/lib/api/audit";
import { useRequestContext } from "@/features/auth/store";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/tables/data-table";
import { LoadingState } from "@/components/status/loading-state";
import type { AuditLog } from "@/types";
import { formatDateTime } from "@/lib/utils";

export default function AuditLogsPage() {
  const context = useRequestContext();
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", context.tenantId, module, action],
    queryFn: () =>
      getAuditLogs(context, {
        module: module ? (module as AuditLog["module"]) : undefined,
        action: action ? (action as AuditLog["action"]) : undefined,
      }),
  });

  const columns = [
    { key: "date", header: "When", cell: (l: AuditLog) => formatDateTime(l.createdAt) },
    { key: "user", header: "User", cell: (l: AuditLog) => l.userName },
    { key: "tenant", header: "Company", cell: (l: AuditLog) => l.tenantName },
    { key: "module", header: "Module", cell: (l: AuditLog) => l.module },
    { key: "action", header: "Action", cell: (l: AuditLog) => l.action },
    { key: "resource", header: "Resource", cell: (l: AuditLog) => l.resource ?? "—" },
    {
      key: "meta",
      header: "Details",
      cell: (l: AuditLog) => (
        <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
          {l.metadata ?? l.ipAddress ?? "—"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Audit logs"
        description="LGPD/security compliance — sensitive actions trail"
      />
      <div className="flex flex-wrap gap-[12px] mb-[16px]">
        <Select value={module} onChange={(e) => setModule(e.target.value)} className="max-w-[180px]">
          <option value="">All modules</option>
          <option value="auth">Auth</option>
          <option value="documents">Documents</option>
          <option value="onboarding">Onboarding</option>
          <option value="administration">Administration</option>
        </Select>
        <Select value={action} onChange={(e) => setAction(e.target.value)} className="max-w-[200px]">
          <option value="">All actions</option>
          <option value="login">Login</option>
          <option value="document_upload">Document upload</option>
          <option value="document_download">Document download</option>
          <option value="approval">Approval</option>
          <option value="rejection">Rejection</option>
          <option value="permission_update">Permission update</option>
          <option value="user_create">User create</option>
          <option value="cross_tenant_blocked">Cross-tenant blocked</option>
        </Select>
        <Input placeholder="Filter by user (mock)" className="max-w-[200px]" disabled />
      </div>
      {isLoading ? (
        <LoadingState />
      ) : (
        <DataTable columns={columns} data={data?.data ?? []} keyExtractor={(l) => l.id} />
      )}
    </div>
  );
}
