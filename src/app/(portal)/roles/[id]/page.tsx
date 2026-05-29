"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getRoleById } from "@/lib/api/roles";
import { useRequestContext } from "@/features/auth/store";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/status/loading-state";
import { PermissionMatrix } from "@/features/roles/permission-matrix";
import { PermissionGuard } from "@/components/guards/permission-guard";

export default function RoleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const context = useRequestContext();

  const { data: role, isLoading } = useQuery({
    queryKey: ["role", id],
    queryFn: () => getRoleById(id, context),
  });

  if (isLoading) return <LoadingState />;
  if (!role) return <p>Role not found</p>;

  return (
    <div>
      <PageHeader
        title={role.name}
        description={role.description}
        actions={
          !role.isSystem && (
            <PermissionGuard permissions={["admin.roles.manage", "admin.settings.read"]}>
              <Button asChild variant="outline">
                <Link href={`/roles/${id}/edit`}>Edit</Link>
              </Button>
            </PermissionGuard>
          )
        }
      />
      {role.isSystem && (
        <Badge variant="secondary" className="mb-[16px]">
          System role — permissions cannot be edited
        </Badge>
      )}
      <Card>
        <CardContent className="pt-[24px]">
          <PermissionMatrix
            selectedIds={role.permissionIds}
            onChange={() => {}}
            readOnly
          />
        </CardContent>
      </Card>
    </div>
  );
}
