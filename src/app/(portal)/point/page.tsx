"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getPointRecords } from "@/lib/api/point";
import { useAuthStore, useRequestContext } from "@/features/auth/store";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status/status-badge";
import { LoadingState } from "@/components/status/loading-state";
import { PermissionGuard } from "@/components/guards/permission-guard";
import type { PointRecord } from "@/types";

export default function PointMirrorPage() {
  const context = useRequestContext();
  const { user } = useAuthStore();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["point-records", context.tenantId, user?.id],
    queryFn: () => getPointRecords(context, user?.id),
  });

  return (
    <div>
      <PageHeader
        title="Point mirror"
        description="Read-only time-sheet view — no clock-in/out registration in V1"
        actions={
          <PermissionGuard permission="point.adjust.request">
            <Button asChild variant="outline">
              <Link href="/point/adjustments/new">Request adjustment</Link>
            </Button>
          </PermissionGuard>
        }
      />

      <p className="text-sm text-muted-foreground mb-[16px]">
        Data mirrored from external time system (ERP integration placeholder).
      </p>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="space-y-[16px]">
          {records.map((record) => (
            <PointDayCard key={record.id} record={record} />
          ))}
        </div>
      )}
    </div>
  );
}

function PointDayCard({ record }: { record: PointRecord }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-[8px]">
        <CardTitle className="text-base">{record.date}</CardTitle>
        <div className="flex items-center gap-[8px]">
          <StatusBadge status={record.status} />
          <span className="text-sm font-medium">{record.totalHours}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-left">
                <th className="pb-[8px]">Type</th>
                <th className="pb-[8px]">Time</th>
              </tr>
            </thead>
            <tbody>
              {record.entries.map((entry, i) => (
                <tr key={i} className="border-t">
                  <td className="py-[8px] capitalize">{entry.type.replace("_", " ")}</td>
                  <td className="py-[8px]">{entry.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
