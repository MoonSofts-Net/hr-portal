"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getOnboardingList } from "@/lib/api/onboarding";
import { useAuthStore, useRequestContext } from "@/features/auth/store";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/status/status-badge";
import { LoadingState } from "@/components/status/loading-state";
import { PermissionGuard } from "@/components/guards/permission-guard";
import type { OnboardingSubmission } from "@/types";

export default function OnboardingPage() {
  const router = useRouter();
  const context = useRequestContext();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["onboarding", context.tenantId],
    queryFn: () => getOnboardingList(context),
  });

  const columns = [
    { key: "user", header: "Employee", cell: (o: OnboardingSubmission) => o.userName },
    {
      key: "progress",
      header: "Progress",
      cell: (o: OnboardingSubmission) => `${o.progressPercent}%`,
    },
    { key: "status", header: "Status", cell: (o: OnboardingSubmission) => <StatusBadge status={o.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Onboarding"
        description="Employee admission and document checklist"
        actions={
          <PermissionGuard permission="onboarding.submit">
            <Button asChild>
              <Link href={`/onboarding/${data?.data[0]?.id ?? "onb-1"}`}>
                My onboarding
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
          keyExtractor={(o) => o.id}
          onRowClick={(o) => {
            const canReview =
              user?.roleId === "role-hr" || user?.roleId === "role-super-admin";
            router.push(
              canReview && o.status !== "not_started"
                ? `/onboarding/review/${o.id}`
                : `/onboarding/${o.id}`
            );
          }}
        />
      )}
    </div>
  );
}
