"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PlatformIcons } from "@/components/icons";
import { getHRRequests } from "@/lib/api/communication";
import { useRequestContext } from "@/features/auth/store";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/status/status-badge";
import { LoadingState } from "@/components/status/loading-state";
import { PermissionGuard } from "@/components/guards/permission-guard";
import type { HRRequest, HRRequestStatus } from "@/types";
import { formatDate } from "@/lib/utils";

export default function RequestsPage() {
  const router = useRouter();
  const context = useRequestContext();
  const [status, setStatus] = useState<HRRequestStatus | "all">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["requests", context.tenantId, status],
    queryFn: () =>
      getHRRequests(context, status === "all" ? undefined : { status }),
  });

  const columns = [
    { key: "subject", header: "Subject", cell: (r: HRRequest) => r.subject },
    { key: "requester", header: "Requester", cell: (r: HRRequest) => r.requesterName },
    { key: "category", header: "Category", cell: (r: HRRequest) => r.category },
    { key: "status", header: "Status", cell: (r: HRRequest) => <StatusBadge status={r.status} /> },
    { key: "date", header: "Created", cell: (r: HRRequest) => formatDate(r.createdAt) },
  ];

  return (
    <div>
      <PageHeader
        title="HR Communication"
        description="Message center and HR requests"
        actions={
          <PermissionGuard permission="hr_requests.create">
            <Button asChild>
              <Link href="/requests/new">
                <PlatformIcons.plus className="h-4 w-4 mr-[8px]" />
                New request
              </Link>
            </Button>
          </PermissionGuard>
        }
      />
      <Tabs
        value={status}
        onValueChange={(v) => setStatus(v as HRRequestStatus | "all")}
        className="mb-[16px]"
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="waiting_employee">Waiting Employee</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>
      </Tabs>
      {isLoading ? (
        <LoadingState />
      ) : (
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          keyExtractor={(r) => r.id}
          onRowClick={(r) => router.push(`/requests/${r.id}`)}
        />
      )}
    </div>
  );
}
