"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PlatformIcons } from "@/components/icons";
import { getUsers } from "@/lib/api/users";
import { useRequestContext } from "@/features/auth/store";
import { maskCpf } from "@/lib/utils/cpf";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/status/status-badge";
import { LoadingState } from "@/components/status/loading-state";
import { PermissionGuard } from "@/components/guards/permission-guard";
import type { User } from "@/types";

export default function UsersPage() {
  const router = useRouter();
  const context = useRequestContext();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["users", context.tenantId, search],
    queryFn: () => getUsers(context, { search }),
  });

  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (u: User) => (
        <div>
          <p className="font-semibold">{u.name}</p>
          <p className="text-xs text-muted-foreground">{u.email}</p>
        </div>
      ),
    },
    { key: "cpf", header: "CPF", cell: (u: User) => <span className="font-mono text-xs">{maskCpf(u.cpf)}</span> },
    { key: "role", header: "Role", cell: (u: User) => u.roleName },
    { key: "status", header: "Status", cell: (u: User) => <StatusBadge status={u.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage employees, roles, and access across your organization"
        actions={
          <PermissionGuard permission="users.create">
            <Button asChild>
              <Link href="/users/new">
                <PlatformIcons.plus className="h-4 w-4 mr-[8px]" />
                New user
              </Link>
            </Button>
          </PermissionGuard>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : (
        <DataTable
          title="All users"
          description={`${data?.total ?? 0} users in this tenant`}
          toolbar={
            <div className="relative w-full sm:w-64">
              <PlatformIcons.search className="absolute left-[12px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name or email..."
                className="pl-[40px] h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          }
          columns={columns}
          data={data?.data ?? []}
          keyExtractor={(u) => u.id}
          onRowClick={(u) => router.push(`/users/${u.id}`)}
        />
      )}
    </div>
  );
}
