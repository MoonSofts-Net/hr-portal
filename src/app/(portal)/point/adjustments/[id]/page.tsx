"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approvePointAdjustment,
  getPointAdjustmentById,
  rejectPointAdjustment,
} from "@/lib/api/point";
import { useRequestContext } from "@/features/auth/store";
import { useConfirm } from "@/components/feedback/confirm-provider";
import { useToast } from "@/components/feedback/toast-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status/status-badge";
import { LoadingState } from "@/components/status/loading-state";
import { EmptyState } from "@/components/status/empty-state";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { formatDateTime } from "@/lib/utils";
import type { ApiError } from "@/types";

export default function PointAdjustmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const context = useRequestContext();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const toast = useToast();
  const [rejectComment, setRejectComment] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);

  const { data: adjustment, isLoading } = useQuery({
    queryKey: ["point-adjustment", id, context.tenantId],
    queryFn: () => getPointAdjustmentById(id, context),
    enabled: Boolean(context.tenantId && id),
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["point-adjustment", id, context.tenantId] });
    await queryClient.invalidateQueries({ queryKey: ["point-adjustments", context.tenantId] });
  };

  const handleApprove = async () => {
    const approved = await confirm({
      title: "Approve adjustment?",
      description: "The employee's time record will be updated according to this request.",
      confirmLabel: "Approve",
      variant: "success",
      details: `${adjustment?.userName} · ${adjustment?.date}\n${adjustment?.requestedChanges}`,
    });
    if (!approved) return;

    setActionError(null);
    setIsActing(true);
    try {
      await approvePointAdjustment(id, context);
      await refresh();
      toast.success("Adjustment approved", "The employee has been notified.");
    } catch (err) {
      const message = (err as ApiError).message ?? "Failed to approve request";
      setActionError(message);
      toast.error("Approval failed", message);
    } finally {
      setIsActing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) {
      setActionError("A review comment is required to reject");
      return;
    }

    const approved = await confirm({
      title: "Reject adjustment?",
      description: "The employee will receive your rejection reason.",
      confirmLabel: "Reject request",
      variant: "destructive",
      details: rejectComment.trim(),
    });
    if (!approved) return;

    setActionError(null);
    setIsActing(true);
    try {
      await rejectPointAdjustment(id, context, rejectComment.trim());
      setShowRejectForm(false);
      setRejectComment("");
      await refresh();
      toast.success("Adjustment rejected");
    } catch (err) {
      const message = (err as ApiError).message ?? "Failed to reject request";
      setActionError(message);
      toast.error("Rejection failed", message);
    } finally {
      setIsActing(false);
    }
  };

  if (isLoading) return <LoadingState />;
  if (!adjustment) {
    return (
      <EmptyState
        title="Adjustment not found"
        description="This request may have been removed or you may not have access."
        actionLabel="Back to adjustments"
        actionHref="/point/adjustments"
      />
    );
  }

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
          {adjustment.reviewedBy && (
            <p>
              <span className="text-muted-foreground">Reviewed by: </span>
              {adjustment.reviewedBy}
            </p>
          )}
          {adjustment.reviewComment && (
            <p>
              <span className="text-muted-foreground">Review comment: </span>
              {adjustment.reviewComment}
            </p>
          )}
        </CardContent>
      </Card>

      {actionError && (
        <p className="mt-[16px] rounded-md border border-destructive/30 bg-destructive/10 px-[12px] py-[8px] text-sm text-destructive max-w-2xl">
          {actionError}
        </p>
      )}

      {adjustment.status === "pending" && (
        <PermissionGuard permission="point.adjust.approve">
          <div className="mt-[16px] max-w-2xl space-y-[12px]">
            {!showRejectForm ? (
              <div className="flex gap-[8px]">
                <Button disabled={isActing} onClick={handleApprove}>
                  {isActing ? "Processing..." : "Approve"}
                </Button>
                <Button
                  variant="destructive"
                  disabled={isActing}
                  onClick={() => setShowRejectForm(true)}
                >
                  Reject
                </Button>
                <Button variant="outline" onClick={() => router.push("/point/adjustments")}>
                  Back to list
                </Button>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-[16px] space-y-[12px]">
                  <Textarea
                    placeholder="Explain why this request is rejected..."
                    rows={3}
                    value={rejectComment}
                    onChange={(event) => setRejectComment(event.target.value)}
                  />
                  <div className="flex gap-[8px]">
                    <Button variant="destructive" disabled={isActing} onClick={handleReject}>
                      Review & reject
                    </Button>
                    <Button
                      variant="outline"
                      disabled={isActing}
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectComment("");
                        setActionError(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </PermissionGuard>
      )}
    </div>
  );
}
