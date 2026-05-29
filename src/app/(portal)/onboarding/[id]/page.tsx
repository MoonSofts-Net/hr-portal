"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getOnboardingById, getDocumentTypes } from "@/lib/api/onboarding";
import { useRequestContext } from "@/features/auth/store";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploadCard } from "@/components/forms/file-upload-card";
import { StatusBadge } from "@/components/status/status-badge";
import { LoadingState } from "@/components/status/loading-state";
import { formatDateTime } from "@/lib/utils";

export default function OnboardingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const context = useRequestContext();

  const { data: onboarding, isLoading } = useQuery({
    queryKey: ["onboarding", id],
    queryFn: () => getOnboardingById(id, context),
  });

  const { data: docTypes } = useQuery({
    queryKey: ["doc-types", context.tenantId],
    queryFn: () => getDocumentTypes(context),
  });

  if (isLoading) return <LoadingState />;
  if (!onboarding) return <p>Onboarding not found</p>;

  return (
    <div>
      <PageHeader
        title="Employee onboarding"
        description={`Progress: ${onboarding.progressPercent}%`}
        actions={<StatusBadge status={onboarding.status} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[16px]">
        <div className="lg:col-span-2 space-y-[16px]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] text-sm">
              <p>
                <span className="text-muted-foreground">Name: </span>
                {onboarding.personalInfo.fullName}
              </p>
              <p>
                <span className="text-muted-foreground">Birth date: </span>
                {onboarding.personalInfo.birthDate}
              </p>
              <p>
                <span className="text-muted-foreground">Phone: </span>
                {onboarding.personalInfo.phone}
              </p>
              <p className="sm:col-span-2">
                <span className="text-muted-foreground">Address: </span>
                {onboarding.personalInfo.address}, {onboarding.personalInfo.city} -{" "}
                {onboarding.personalInfo.state}
              </p>
            </CardContent>
          </Card>

          <div>
            <h3 className="font-medium mb-[12px]">Required documents</h3>
            <div className="grid gap-[12px]">
              {onboarding.documents.map((doc) => (
                <FileUploadCard
                  key={doc.documentTypeId}
                  title={doc.documentTypeLabel}
                  status={doc.status}
                  rejectionReason={doc.rejectionReason}
                  onUpload={() => {}}
                />
              ))}
            </div>
          </div>

          {onboarding.rejectionReason && (
            <Card className="border-destructive">
              <CardContent className="pt-[16px] text-sm text-destructive">
                Rejection reason: {onboarding.rejectionReason}
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-[12px]">
            {onboarding.timeline.map((event) => (
              <div key={event.id} className="border-l-2 border-primary pl-[12px] pb-[8px]">
                <p className="text-sm font-medium">{event.message}</p>
                <p className="text-xs text-muted-foreground">
                  {event.actorName && `${event.actorName} · `}
                  {formatDateTime(event.createdAt)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {docTypes && (
        <p className="text-xs text-muted-foreground mt-[16px]">
          Parametrizable types: {docTypes.map((d) => d.label).join(", ")}
        </p>
      )}
    </div>
  );
}
