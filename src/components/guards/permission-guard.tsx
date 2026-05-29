"use client";

import { usePermissions } from "@/features/auth/store";
import { hasAnyPermission, hasPermission } from "@/lib/permissions/check";

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/** Hides UI when user lacks permission. Backend remains source of truth. */
export function PermissionGuard({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const userPermissions = usePermissions();

  let allowed = false;
  if (permission) {
    allowed = hasPermission(userPermissions, permission);
  } else if (permissions.length > 0) {
    allowed = requireAll
      ? permissions.every((p) => hasPermission(userPermissions, p))
      : hasAnyPermission(userPermissions, permissions);
  } else {
    allowed = true;
  }

  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
