import { PermissionAction, PermissionModule } from '@prisma/client';

export interface PermissionDefinition {
  id: string;
  module: PermissionModule;
  action: PermissionAction;
  label: string;
  description?: string;
}

/** Canonical permission IDs — backend source of truth for RBAC. */
export const PERMISSION_CATALOG: PermissionDefinition[] = [
  { id: 'dashboard.read', module: 'DASHBOARD', action: 'VIEW', label: 'View dashboard' },
  { id: 'users.read', module: 'USERS', action: 'VIEW', label: 'View users' },
  { id: 'users.create', module: 'USERS', action: 'CREATE', label: 'Create users' },
  { id: 'users.update', module: 'USERS', action: 'EDIT', label: 'Update users' },
  { id: 'onboarding.read', module: 'ONBOARDING', action: 'VIEW', label: 'View onboarding' },
  { id: 'onboarding.submit', module: 'ONBOARDING', action: 'CREATE', label: 'Submit onboarding' },
  { id: 'onboarding.approve', module: 'ONBOARDING', action: 'APPROVE', label: 'Approve onboarding' },
  { id: 'onboarding.reject', module: 'ONBOARDING', action: 'REJECT', label: 'Reject onboarding' },
  { id: 'documents.read', module: 'DOCUMENTS', action: 'VIEW', label: 'View documents' },
  { id: 'documents.upload', module: 'DOCUMENTS', action: 'UPLOAD', label: 'Upload documents' },
  { id: 'documents.download', module: 'DOCUMENTS', action: 'DOWNLOAD', label: 'Download documents' },
  { id: 'documents.approve', module: 'DOCUMENTS', action: 'APPROVE', label: 'Approve documents' },
  { id: 'hr_requests.read', module: 'COMMUNICATION', action: 'VIEW', label: 'View HR requests' },
  { id: 'hr_requests.create', module: 'COMMUNICATION', action: 'CREATE', label: 'Create HR requests' },
  { id: 'hr_requests.respond', module: 'COMMUNICATION', action: 'MANAGE', label: 'Respond to HR requests' },
  { id: 'point.read', module: 'POINT', action: 'VIEW', label: 'View point records' },
  { id: 'point.adjust.request', module: 'POINT', action: 'CREATE', label: 'Request point adjustments' },
  { id: 'point.adjust.approve', module: 'POINT', action: 'APPROVE', label: 'Approve point adjustments' },
  { id: 'admin.settings.read', module: 'ADMINISTRATION', action: 'VIEW', label: 'View admin settings' },
  { id: 'admin.settings.update', module: 'ADMINISTRATION', action: 'MANAGE', label: 'Update admin settings' },
  { id: 'admin.roles.manage', module: 'ADMINISTRATION', action: 'EDIT', label: 'Manage roles' },
  { id: 'audit.read', module: 'AUDIT', action: 'VIEW', label: 'View audit logs' },
];

export const ALL_PERMISSION_IDS = PERMISSION_CATALOG.map((p) => p.id);

export const SUPER_ADMIN_WILDCARD = '*';

export function isWildcardPermission(permissionIds: string[]): boolean {
  return permissionIds.includes(SUPER_ADMIN_WILDCARD);
}
