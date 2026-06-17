"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PlatformIcons } from "@/components/icons";
import { getBranches } from "@/lib/api/branches";
import { useRequestContext } from "@/features/auth/store";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/status/loading-state";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { useState } from "react";
import type { Branch } from "@/types";

export default function BranchesPage() {
  const router = useRouter();
  const context = useRequestContext();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["branches", context.tenantId, search],
    queryFn: () => getBranches(context, { search, pageSize: 100 }),
  });

  const columns = [
    { key: "code", header: "Code", cell: (b: Branch) => <span className="font-mono text-xs">{b.code}</span> },
    {
      key: "name",
      header: "Branch",
      cell: (b: Branch) => (
        <div>
          <p className="font-semibold">{b.name}</p>
          {(b.city || b.state) && (
            <p className="text-xs text-muted-foreground">
              {[b.city, b.state].filter(Boolean).join(" — ")}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "contract",
      header: "Contract",
      cell: (b: Branch) =>
        b.isContracted ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="muted">Not contracted</Badge>
        ),
    },
    {
      key: "status",
      header: "Status",
      cell: (b: Branch) =>
        b.isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="muted">Inactive</Badge>
        ),
    },
    {
      key: "users",
      header: "Employees",
      cell: (b: Branch) => b.userCount ?? 0,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Branches"
        description="Manage company branches (filiais) — add, contract, and associate employees"
        actions={
          <PermissionGuard permission="admin.branches.manage">
            <Button asChild>
              <Link href="/admin/branches/new">
                <PlatformIcons.plus className="h-4 w-4 mr-[8px]" />
                New branch
              </Link>
            </Button>
          </PermissionGuard>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : (
        <DataTable
          title="All branches"
          description={`${data?.total ?? 0} branches in this company`}
          toolbar={
            <div className="relative w-full sm:w-64">
              <PlatformIcons.search className="absolute left-[12px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search code, name, city..."
                className="pl-[40px] h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          }
          columns={columns}
          data={data?.data ?? []}
          keyExtractor={(b) => b.id}
          onRowClick={(b) => router.push(`/admin/branches/${b.id}/edit`)}
        />
      )}
    </div>
  );
}
