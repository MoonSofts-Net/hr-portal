import type { Permission, PermissionModule } from "@/types";

/** Aligned with backend `permission-catalog.ts` — IDs must match API JWT permissions. */
export const PERMISSION_DEFINITIONS: Permission[] = [
  { id: "dashboard.read", module: "dashboard", action: "view", label: "View dashboard" },
  { id: "users.read", module: "users", action: "view", label: "View users" },
  { id: "users.create", module: "users", action: "create", label: "Create users" },
  { id: "users.update", module: "users", action: "edit", label: "Update users" },
  { id: "onboarding.read", module: "onboarding", action: "view", label: "View onboarding" },
  { id: "onboarding.submit", module: "onboarding", action: "create", label: "Submit onboarding" },
  { id: "onboarding.approve", module: "onboarding", action: "approve", label: "Approve onboarding" },
  { id: "onboarding.reject", module: "onboarding", action: "reject", label: "Reject onboarding" },
  { id: "documents.read", module: "documents", action: "view", label: "View documents" },
  { id: "documents.upload", module: "documents", action: "upload", label: "Upload documents" },
  { id: "documents.download", module: "documents", action: "download", label: "Download documents" },
  { id: "documents.approve", module: "documents", action: "approve", label: "Approve documents" },
  { id: "hr_requests.read", module: "communication", action: "view", label: "View HR requests" },
  { id: "hr_requests.create", module: "communication", action: "create", label: "Create HR requests" },
  { id: "hr_requests.respond", module: "communication", action: "manage", label: "Respond to HR requests" },
  { id: "point.read", module: "point", action: "view", label: "View point records" },
  { id: "point.adjust.request", module: "point", action: "create", label: "Request point adjustments" },
  { id: "point.adjust.approve", module: "point", action: "approve", label: "Approve point adjustments" },
  { id: "admin.settings.read", module: "administration", action: "view", label: "View administration" },
  { id: "admin.settings.update", module: "administration", action: "manage", label: "Update admin settings" },
  { id: "admin.roles.manage", module: "administration", action: "edit", label: "Manage roles" },
  { id: "audit.read", module: "audit", action: "view", label: "View audit logs" },
];

export const MODULE_LABELS: Record<PermissionModule, string> = {
  dashboard: "Dashboard",
  users: "Users",
  onboarding: "Onboarding",
  documents: "Documents",
  communication: "HR Communication",
  point: "Point",
  administration: "Administration",
  audit: "Audit Logs",
};

export const SUPER_ADMIN_ROLE_ID = "role-super-admin";

export function getPermissionsByModule(): Record<PermissionModule, Permission[]> {
  const grouped = {} as Record<PermissionModule, Permission[]>;
  for (const p of PERMISSION_DEFINITIONS) {
    if (!grouped[p.module]) grouped[p.module] = [];
    grouped[p.module].push(p);
  }
  return grouped;
}
