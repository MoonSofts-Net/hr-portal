"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getPointAdjustmentById } from "@/lib/api/point";
import { useRequestContext } from "@/features/auth/store";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status/status-badge";
import { LoadingState } from "@/components/status/loading-state";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { formatDateTime } from "@/lib/utils";

export default function PointAdjustmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const context = useRequestContext();

  const { data: adjustment, isLoading } = useQuery({
    queryKey: ["point-adjustment", id],
    queryFn: () => getPointAdjustmentById(id, context),
  });

  if (isLoading) return <LoadingState />;
  if (!adjustment) return <p>Not found</p>;

  return (
    <div>
      <PageHeader
        title="Adjustment request"
        description={adjustment.userName}
        actions={<StatusBadge status={adjustment.status} />}
      />
      <Card className="max-w-2xl">
        <CardContent className="pt-[24px] space-y-[12px] text-sm">
          <p>
            <span className="text-muted-foreground">Date: </span>
            {adjustment.date}
          </p>
          <p>
            <span className="text-muted-foreground">Reason: </span>
            {adjustment.reason}
          </p>
          <p>
            <span className="text-muted-foreground">Requested changes: </span>
            {adjustment.requestedChanges}
          </p>
          <p>
            <span className="text-muted-foreground">Submitted: </span>
            {formatDateTime(adjustment.createdAt)}
          </p>
          {adjustment.reviewComment && (
            <p>
              <span className="text-muted-foreground">Review: </span>
              {adjustment.reviewComment}
            </p>
          )}
        </CardContent>
      </Card>

      {adjustment.status === "pending" && (
        <PermissionGuard permission="point.adjust.approve">
          <div className="flex gap-[8px] mt-[16px]">
            <Button>Approve</Button>
            <Button variant="destructive">Reject</Button>
          </div>
        </PermissionGuard>
      )}
    </div>
  );
}
