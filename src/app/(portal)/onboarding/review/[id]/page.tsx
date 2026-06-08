"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveOnboarding,
  getOnboardingById,
  rejectOnboarding,
} from "@/lib/api/onboarding";
import { useRequestContext } from "@/features/auth/store";
import { useConfirm } from "@/components/feedback/confirm-provider";
import { useToast } from "@/components/feedback/toast-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status/status-badge";
import { LoadingState } from "@/components/status/loading-state";
import { EmptyState } from "@/components/status/empty-state";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/utils";
import type { ApiError } from "@/types";

export default function OnboardingReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const context = useRequestContext();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);

  const { data: onboarding, isLoading } = useQuery({
    queryKey: ["onboarding", id, context.tenantId],
    queryFn: () => getOnboardingById(id, context),
    enabled: Boolean(context.tenantId && id),
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["onboarding", id, context.tenantId] });
    await queryClient.invalidateQueries({ queryKey: ["onboarding", context.tenantId] });
  };

  const handleApprove = async () => {
    const approved = await confirm({
      title: "Approve onboarding?",
      description: `Confirm that all documents for ${onboarding?.userName} are valid and complete.`,
      confirmLabel: "Approve onboarding",
      variant: "success",
    });
    if (!approved) return;

    setActionError(null);
    setIsActing(true);
    try {
      await approveOnboarding(id, context);
      await refresh();
      toast.success("Onboarding approved", `${onboarding?.userName} has been approved.`);
      router.push(`/onboarding/${id}`);
    } catch (err) {
      const message = (err as ApiError).message ?? "Failed to approve onboarding";
      setActionError(message);
      toast.error("Approval failed", message);
    } finally {
      setIsActing(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      setActionError("A rejection reason is required");
      return;
    }

    const approved = await confirm({
      title: "Reject onboarding?",
      description: "The employee will be asked to fix issues and resubmit.",
      confirmLabel: "Reject onboarding",
      variant: "destructive",
      details: reason.trim(),
    });
    if (!approved) return;

    setActionError(null);
    setIsActing(true);
    try {
      await rejectOnboarding(id, context, reason.trim());
      await refresh();
      toast.success("Onboarding rejected");
      router.push(`/onboarding/${id}`);
    } catch (err) {
      const message = (err as ApiError).message ?? "Failed to reject onboarding";
      setActionError(message);
      toast.error("Rejection failed", message);
    } finally {
      setIsActing(false);
    }
  };

  if (isLoading) return <LoadingState />;
  if (!onboarding) {
    return (
      <EmptyState
        title="Onboarding not found"
        description="This process may have been removed or you may not have access."
        actionLabel="Back to onboarding"
        actionHref="/onboarding"
      />
    );
  }

  const canReview = onboarding.status === "submitted" || onboarding.status === "under_review";

  return (
    <div>
      <PageHeader
        title="HR Review"
        description={`Review onboarding for ${onboarding.userName}`}
        actions={<StatusBadge status={onboarding.status} />}
      />

      <Card className="mb-[16px]">
        <CardHeader>
          <CardTitle className="text-base">Process summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-[8px] text-sm">
          <p>
            <span className="text-muted-foreground">Progress: </span>
            {onboarding.progressPercent}%
          </p>
          {onboarding.submittedAt && (
            <p>
              <span className="text-muted-foreground">Submitted: </span>
              {formatDateTime(onboarding.submittedAt)}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-[16px]">
        <CardHeader>
          <CardTitle className="text-base">Documents checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-[8px]">
          {onboarding.documents.map((doc) => (
            <div
              key={doc.documentTypeId}
              className="flex items-center justify-between border rounded-md p-[12px] text-sm"
            >
              <span>{doc.documentTypeLabel}</span>
              <StatusBadge status={doc.status} />
            </div>
          ))}
        </CardContent>
      </Card>

      {actionError && (
        <p className="mb-[16px] rounded-md border border-destructive/30 bg-destructive/10 px-[12px] py-[8px] text-sm text-destructive">
          {actionError}
        </p>
      )}

      <PermissionGuard permissions={["onboarding.approve", "onboarding.reject"]}>
        {canReview ? (
          <Card>
            <CardContent className="pt-[24px] space-y-[16px]">
              <Textarea
                placeholder="Rejection reason (required for rejection)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
              <div className="flex gap-[8px]">
                <Button disabled={isActing} onClick={handleApprove}>
                  {isActing ? "Processing..." : "Approve onboarding"}
                </Button>
                <Button variant="destructive" disabled={isActing} onClick={handleReject}>
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-[24px] text-sm text-muted-foreground">
              This onboarding is not awaiting review (current status: {onboarding.status.replace("_", " ")}).
            </CardContent>
          </Card>
        )}
      </PermissionGuard>
    </div>
  );
}
