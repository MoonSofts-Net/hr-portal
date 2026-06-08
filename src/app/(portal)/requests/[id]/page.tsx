"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addHRRequestMessage,
  getHRRequestById,
  updateHRRequestStatus,
} from "@/lib/api/communication";
import { useRequestContext } from "@/features/auth/store";
import { useConfirm } from "@/components/feedback/confirm-provider";
import { useToast } from "@/components/feedback/toast-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status/status-badge";
import { LoadingState } from "@/components/status/loading-state";
import { EmptyState } from "@/components/status/empty-state";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatDateTime } from "@/lib/utils";
import { PermissionGuard } from "@/components/guards/permission-guard";
import type { ApiError, HRRequestStatus } from "@/types";

const HR_STATUS_OPTIONS: { value: HRRequestStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "waiting_employee", label: "Waiting employee" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const STATUS_LABELS: Record<HRRequestStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  waiting_employee: "Waiting employee",
  resolved: "Resolved",
  closed: "Closed",
};

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const context = useRequestContext();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const toast = useToast();
  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<HRRequestStatus>("open");

  const { data: request, isLoading, isError, error } = useQuery({
    queryKey: ["request", id, context.tenantId],
    queryFn: () => getHRRequestById(id, context),
    enabled: Boolean(context.tenantId && id),
  });

  useEffect(() => {
    if (request) setSelectedStatus(request.status);
  }, [request?.status, request?.id]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["request", id, context.tenantId] });
    await queryClient.invalidateQueries({ queryKey: ["requests", context.tenantId] });
  };

  const sendMessage = async (body: string, isInternal: boolean) => {
    if (!body.trim()) return;

    const approved = await confirm({
      title: isInternal ? "Add internal note?" : "Send reply?",
      description: isInternal
        ? "This note is visible to HR staff only."
        : "The requester will be notified of your reply.",
      confirmLabel: isInternal ? "Add note" : "Send reply",
      variant: isInternal ? "default" : "success",
      details: body.trim(),
    });
    if (!approved) return;

    setSubmitError(null);
    setIsSending(true);
    try {
      await addHRRequestMessage(context, id, body.trim(), isInternal);
      await refresh();
      if (isInternal) setInternalNote("");
      else setReply("");
      toast.success(isInternal ? "Internal note added" : "Reply sent");
    } catch (err) {
      const apiErr = err as ApiError;
      const message = apiErr.message ?? "Failed to send message";
      setSubmitError(message);
      toast.error("Action failed", message);
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async () => {
    if (!request || selectedStatus === request.status) return;

    const approved = await confirm({
      title: "Update request status?",
      description: `Change status from "${STATUS_LABELS[request.status]}" to "${STATUS_LABELS[selectedStatus]}".`,
      confirmLabel: "Update status",
      variant: selectedStatus === "closed" ? "warning" : "default",
    });
    if (!approved) return;

    setIsUpdatingStatus(true);
    setSubmitError(null);
    try {
      await updateHRRequestStatus(context, id, selectedStatus);
      await refresh();
      toast.success("Status updated", `Request is now ${STATUS_LABELS[selectedStatus]}.`);
    } catch (err) {
      const apiErr = err as ApiError;
      const message = apiErr.message ?? "Failed to update status";
      setSubmitError(message);
      toast.error("Update failed", message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 px-[12px] py-[8px] text-sm text-destructive">
        {(error as ApiError)?.message ?? "Failed to load request"}
      </p>
    );
  }
  if (!request) {
    return (
      <EmptyState
        title="Request not found"
        description="This request may have been removed or you may not have access."
        actionLabel="Back to requests"
        actionHref="/requests"
      />
    );
  }

  const publicMessages = request.messages.filter((m) => !m.isInternal);

  return (
    <div>
      <PageHeader
        title={request.subject}
        description={`${request.category} · ${request.requesterName} · Priority: ${request.priority}`}
        actions={<StatusBadge status={request.status} />}
      />

      {submitError && (
        <p className="mb-[16px] rounded-md border border-destructive/30 bg-destructive/10 px-[12px] py-[8px] text-sm text-destructive">
          {submitError}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[16px]">
        <div className="lg:col-span-2 space-y-[12px]">
          {publicMessages.length === 0 ? (
            <EmptyState
              title="No messages yet"
              description="Start the conversation by sending a reply below."
            />
          ) : (
            publicMessages.map((msg) => (
              <Card key={msg.id}>
                <CardContent className="pt-[16px]">
                  <div className="flex justify-between text-sm mb-[8px]">
                    <span className="font-medium">{msg.authorName}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatDateTime(msg.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                </CardContent>
              </Card>
            ))
          )}

          <Card>
            <CardContent className="pt-[16px] space-y-[12px]">
              <Textarea
                placeholder="Write a reply..."
                rows={3}
                value={reply}
                onChange={(event) => setReply(event.target.value)}
              />
              <Button
                size="sm"
                disabled={isSending || !reply.trim()}
                onClick={() => sendMessage(reply, false)}
              >
                {isSending ? "Sending..." : "Send reply"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-[16px]">
          <Card>
            <CardHeader className="pb-[8px]">
              <CardTitle className="text-base">Request details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-[8px] text-sm">
              <p>
                <span className="text-muted-foreground">Created: </span>
                {formatDateTime(request.createdAt)}
              </p>
              <p>
                <span className="text-muted-foreground">Updated: </span>
                {formatDateTime(request.updatedAt)}
              </p>
              {request.assignedTo && (
                <p>
                  <span className="text-muted-foreground">Assigned to: </span>
                  {request.assignedTo}
                </p>
              )}
            </CardContent>
          </Card>

          <PermissionGuard permission="hr_requests.respond">
            <Card>
              <CardHeader className="pb-[8px]">
                <CardTitle className="text-base">HR management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-[12px]">
                <div>
                  <p className="text-xs text-muted-foreground mb-[6px]">Status</p>
                  <Select
                    value={selectedStatus}
                    onChange={(event) =>
                      setSelectedStatus(event.target.value as HRRequestStatus)
                    }
                  >
                    {HR_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  disabled={isUpdatingStatus || selectedStatus === request.status}
                  onClick={handleStatusChange}
                >
                  {isUpdatingStatus ? "Updating..." : "Update status"}
                </Button>

                <div className="border-t border-border/80 pt-[12px]">
                  <h4 className="font-medium text-sm mb-[8px]">Internal notes</h4>
                  <p className="text-xs text-muted-foreground mb-[12px]">
                    Visible to HR/admin users only
                  </p>
                  {request.messages
                    .filter((m) => m.isInternal)
                    .map((m) => (
                      <p key={m.id} className="text-sm border-b py-[8px] whitespace-pre-wrap">
                        {m.body}
                      </p>
                    ))}
                  {request.messages.every((m) => !m.isInternal) && (
                    <p className="text-sm text-muted-foreground mb-[12px]">No internal notes yet</p>
                  )}
                  <Textarea
                    placeholder="Add internal note..."
                    rows={3}
                    value={internalNote}
                    onChange={(event) => setInternalNote(event.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-[8px]"
                    disabled={isSending || !internalNote.trim()}
                    onClick={() => sendMessage(internalNote, true)}
                  >
                    Add note
                  </Button>
                </div>
              </CardContent>
            </Card>
          </PermissionGuard>
        </div>
      </div>
    </div>
  );
}
