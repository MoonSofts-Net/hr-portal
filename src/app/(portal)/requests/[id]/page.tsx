"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getHRRequestById } from "@/lib/api/communication";
import { useRequestContext } from "@/features/auth/store";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status/status-badge";
import { LoadingState } from "@/components/status/loading-state";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { PermissionGuard } from "@/components/guards/permission-guard";

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const context = useRequestContext();

  const { data: request, isLoading } = useQuery({
    queryKey: ["request", id],
    queryFn: () => getHRRequestById(id, context),
  });

  if (isLoading) return <LoadingState />;
  if (!request) return <p>Request not found</p>;

  const publicMessages = request.messages.filter((m) => !m.isInternal);

  return (
    <div>
      <PageHeader
        title={request.subject}
        description={`${request.category} · ${request.requesterName}`}
        actions={<StatusBadge status={request.status} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[16px]">
        <div className="lg:col-span-2 space-y-[12px]">
          {publicMessages.map((msg) => (
            <Card key={msg.id}>
              <CardContent className="pt-[16px]">
                <div className="flex justify-between text-sm mb-[8px]">
                  <span className="font-medium">{msg.authorName}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatDateTime(msg.createdAt)}
                  </span>
                </div>
                <p className="text-sm">{msg.body}</p>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardContent className="pt-[16px] space-y-[12px]">
              <Textarea placeholder="Write a reply..." rows={3} />
              <Button size="sm">Send reply</Button>
            </CardContent>
          </Card>
        </div>

        <PermissionGuard permission="hr_requests.respond">
          <Card>
            <CardContent className="pt-[16px]">
              <h4 className="font-medium text-sm mb-[8px]">HR internal notes</h4>
              <p className="text-xs text-muted-foreground mb-[12px]">
                Segmented view for HR/admin users only
              </p>
              {request.messages
                .filter((m) => m.isInternal)
                .map((m) => (
                  <p key={m.id} className="text-sm border-b py-[8px]">
                    {m.body}
                  </p>
                ))}
              {request.messages.every((m) => !m.isInternal) && (
                <p className="text-sm text-muted-foreground">No internal notes</p>
              )}
            </CardContent>
          </Card>
        </PermissionGuard>
      </div>
    </div>
  );
}
