"use client";

import { useQuery } from "@tanstack/react-query";
import { getTenants } from "@/lib/api/admin";
import { useRequestContext } from "@/features/auth/store";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/status/loading-state";
import type { Tenant } from "@/types";

export default function CompaniesPage() {
  const context = useRequestContext();

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => getTenants(context),
  });

  const columns = [
    { key: "name", header: "Company", cell: (t: Tenant) => t.name },
    { key: "slug", header: "Slug", cell: (t: Tenant) => t.slug },
    {
      key: "status",
      header: "Status",
      cell: (t: Tenant) =>
        t.isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="muted">Inactive</Badge>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Companies"
        description="Tenant management for multi-company SaaS operation"
      />
      {isLoading ? (
        <LoadingState />
      ) : (
        <DataTable columns={columns} data={tenants} keyExtractor={(t) => t.id} />
      )}
    </div>
  );
}
