import type { PermissionAction, PermissionModule } from "@/types";

export function hasPermission(
  userPermissionIds: string[],
  permissionId: string
): boolean {
  if (userPermissionIds.includes("*")) return true;
  return userPermissionIds.includes(permissionId);
}

export function hasAnyPermission(
  userPermissionIds: string[],
  permissionIds: string[]
): boolean {
  return permissionIds.some((id) => hasPermission(userPermissionIds, id));
}

export function hasModuleAction(
  userPermissionIds: string[],
  module: PermissionModule,
  action: PermissionAction
): boolean {
  return hasPermission(userPermissionIds, `${module}.${action}`);
}
