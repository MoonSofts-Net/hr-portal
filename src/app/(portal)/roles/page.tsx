"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PlatformIcons } from "@/components/icons";
import { getRoles } from "@/lib/api/roles";
import { useRequestContext } from "@/features/auth/store";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/status/loading-state";
import { PermissionGuard } from "@/components/guards/permission-guard";
import type { Role } from "@/types";

export default function RolesPage() {
  const router = useRouter();
  const context = useRequestContext();

  const { data, isLoading } = useQuery({
    queryKey: ["roles", context.tenantId],
    queryFn: () => getRoles(context),
  });

  const columns = [
    { key: "name", header: "Role", cell: (r: Role) => r.name },
    {
      key: "system",
      header: "Type",
      cell: (r: Role) =>
        r.isSystem ? (
          <Badge variant="secondary">System</Badge>
        ) : (
          <Badge variant="outline">Configurable</Badge>
        ),
    },
    { key: "desc", header: "Description", cell: (r: Role) => r.description },
    {
      key: "perms",
      header: "Permissions",
      cell: (r: Role) =>
        r.permissionIds.includes("*") ? "All" : `${r.permissionIds.length} selected`,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        description="Dynamically configurable roles (except Super Administrator)"
        actions={
          <PermissionGuard permissions={["admin.roles.manage", "admin.settings.read"]}>
            <Button asChild>
              <Link href="/roles/new">
                <PlatformIcons.plus className="h-4 w-4 mr-[8px]" />
                New role
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
          keyExtractor={(r) => r.id}
          onRowClick={(r) => router.push(`/roles/${r.id}`)}
        />
      )}
    </div>
  );
}
