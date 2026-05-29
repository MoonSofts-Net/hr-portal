"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PlatformIcons } from "@/components/icons";
import { getPointAdjustments } from "@/lib/api/point";
import { useRequestContext } from "@/features/auth/store";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/status/status-badge";
import { LoadingState } from "@/components/status/loading-state";
import { PermissionGuard } from "@/components/guards/permission-guard";
import type { PointAdjustmentRequest } from "@/types";
import { formatDate } from "@/lib/utils";

export default function PointAdjustmentsPage() {
  const router = useRouter();
  const context = useRequestContext();

  const { data, isLoading } = useQuery({
    queryKey: ["point-adjustments", context.tenantId],
    queryFn: () => getPointAdjustments(context),
  });

  const columns = [
    { key: "user", header: "Employee", cell: (a: PointAdjustmentRequest) => a.userName },
    { key: "date", header: "Date", cell: (a: PointAdjustmentRequest) => a.date },
    { key: "reason", header: "Reason", cell: (a: PointAdjustmentRequest) => a.reason },
    { key: "status", header: "Status", cell: (a: PointAdjustmentRequest) => <StatusBadge status={a.status} /> },
    {
      key: "created",
      header: "Requested",
      cell: (a: PointAdjustmentRequest) => formatDate(a.createdAt),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Point adjustments"
        description="Request and approval history"
        actions={
          <PermissionGuard permission="point.adjust.request">
            <Button asChild>
              <Link href="/point/adjustments/new">
                <PlatformIcons.plus className="h-4 w-4 mr-[8px]" />
                New request
              </Link>
            </Button>
          </PermissionGuard>
        }
      />
      {isLoading ? (
        <LoadingState />
      ) : (
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          keyExtractor={(a) => a.id}
          onRowClick={(a) => router.push(`/point/adjustments/${a.id}`)}
        />
      )}
    </div>
  );
}
