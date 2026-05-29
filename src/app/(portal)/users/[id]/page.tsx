"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getUserById } from "@/lib/api/users";
import { getRoleById } from "@/lib/api/roles";
import { useRequestContext } from "@/features/auth/store";
import { maskCpf } from "@/lib/utils/cpf";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status/status-badge";
import { LoadingState } from "@/components/status/loading-state";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { PERMISSION_DEFINITIONS } from "@/lib/permissions/definitions";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const context = useRequestContext();

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => getUserById(id, context),
  });

  const { data: role } = useQuery({
    queryKey: ["role", user?.roleId],
    queryFn: () => getRoleById(user!.roleId, context),
    enabled: !!user?.roleId,
  });

  const permissions = role?.permissionIds.includes("*")
    ? PERMISSION_DEFINITIONS
    : PERMISSION_DEFINITIONS.filter((p) => role?.permissionIds.includes(p.id));

  if (isLoading) return <LoadingState />;
  if (!user) return <p>User not found</p>;

  return (
    <div>
      <PageHeader
        title={user.name}
        description={user.email}
        actions={
          <PermissionGuard permission="users.update">
            <Button asChild variant="outline">
              <Link href={`/users/${id}/edit`}>Edit</Link>
            </Button>
          </PermissionGuard>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[16px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-[8px] text-sm">
            <p>
              <span className="text-muted-foreground">CPF: </span>
              {maskCpf(user.cpf)}
            </p>
            <p>
              <span className="text-muted-foreground">Role: </span>
              {user.roleName}
            </p>
            <p>
              <span className="text-muted-foreground">Department: </span>
              {user.department ?? "—"}
            </p>
            <p className="flex items-center gap-[8px]">
              <span className="text-muted-foreground">Status: </span>
              <StatusBadge status={user.status} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Permission summary</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-[4px] max-h-64 overflow-y-auto">
              {permissions.slice(0, 12).map((p) => (
                <li key={p.id} className="text-muted-foreground">
                  • {p.label}
                </li>
              ))}
              {permissions.length > 12 && (
                <li className="text-xs text-muted-foreground">
                  +{permissions.length - 12} more via role configuration
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
