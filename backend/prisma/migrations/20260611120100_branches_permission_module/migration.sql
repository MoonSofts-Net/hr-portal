-- Extend PermissionModule for branch-scoped RBAC permissions
ALTER TYPE "PermissionModule" ADD VALUE IF NOT EXISTS 'BRANCHES';
