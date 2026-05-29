"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getOnboardingById } from "@/lib/api/onboarding";
import { useRequestContext } from "@/features/auth/store";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status/status-badge";
import { LoadingState } from "@/components/status/loading-state";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function OnboardingReviewPage() {
  const { id } = useParams<{ id: string }>();
  const context = useRequestContext();
  const [reason, setReason] = useState("");

  const { data: onboarding, isLoading } = useQuery({
    queryKey: ["onboarding", id],
    queryFn: () => getOnboardingById(id, context),
  });

  if (isLoading) return <LoadingState />;
  if (!onboarding) return <p>Not found</p>;

  return (
    <div>
      <PageHeader
        title="HR Review"
        description={`Review onboarding for ${onboarding.userName}`}
        actions={<StatusBadge status={onboarding.status} />}
      />

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

      <PermissionGuard permissions={["onboarding.approve", "onboarding.reject"]}>
        <Card>
          <CardContent className="pt-[24px] space-y-[16px]">
            <Textarea
              placeholder="Rejection reason (required for rejection)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex gap-[8px]">
              <Button variant="default">Approve onboarding</Button>
              <Button variant="destructive">Reject</Button>
            </div>
          </CardContent>
        </Card>
      </PermissionGuard>
    </div>
  );
}
