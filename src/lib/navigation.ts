import type { IconType } from "react-icons";
import { PlatformIcons } from "@/components/icons";
import { hasPermission } from "@/lib/permissions/check";

export interface NavItem {
  labelKey: string;
  href: string;
  icon: IconType;
  permission?: string;
  permissions?: string[];
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  { labelKey: "nav.profile", href: "/profile", icon: PlatformIcons.users },
  { labelKey: "nav.dashboard", href: "/dashboard", icon: PlatformIcons.dashboard, permission: "dashboard.read" },
  { labelKey: "nav.users", href: "/users", icon: PlatformIcons.users, permission: "users.read" },
  {
    labelKey: "nav.roles",
    href: "/roles",
    icon: PlatformIcons.roles,
    permissions: ["admin.roles.manage", "admin.settings.read"],
  },
  { labelKey: "nav.onboarding", href: "/onboarding", icon: PlatformIcons.onboarding, permission: "onboarding.read" },
  { labelKey: "nav.documents", href: "/documents", icon: PlatformIcons.documents, permission: "documents.read" },
  { labelKey: "nav.requests", href: "/requests", icon: PlatformIcons.requests, permission: "hr_requests.read" },
  {
    labelKey: "nav.point",
    href: "/point",
    icon: PlatformIcons.point,
    permission: "point.read",
    children: [
      { labelKey: "nav.mirror", href: "/point", icon: PlatformIcons.point, permission: "point.read" },
      {
        labelKey: "nav.adjustments",
        href: "/point/adjustments",
        icon: PlatformIcons.calendar,
        permissions: ["point.read", "point.adjust.request", "point.adjust.approve"],
      },
    ],
  },
  {
    labelKey: "nav.admin",
    href: "/admin",
    icon: PlatformIcons.admin,
    permission: "admin.settings.read",
    children: [
      { labelKey: "nav.overview", href: "/admin", icon: PlatformIcons.admin, permission: "admin.settings.read" },
      {
        labelKey: "nav.companies",
        href: "/admin/companies",
        icon: PlatformIcons.companies,
        permission: "admin.settings.update",
      },
      {
        labelKey: "nav.branches",
        href: "/admin/branches",
        icon: PlatformIcons.building,
        permissions: ["admin.branches.read", "admin.branches.manage"],
      },
      {
        labelKey: "nav.settings",
        href: "/admin/settings",
        icon: PlatformIcons.admin,
        permission: "admin.settings.update",
      },
    ],
  },
  { labelKey: "nav.auditLogs", href: "/audit-logs", icon: PlatformIcons.audit, permission: "audit.read" },
];

export function getVisibleNavItems(permissionIds: string[]): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    if (item.permission) {
      return hasPermission(permissionIds, item.permission);
    }
    if (item.permissions?.length) {
      return item.permissions.some((p) => hasPermission(permissionIds, p));
    }
    return true;
  });
}

export const ROUTE_LABEL_KEYS: Record<string, string> = {
  profile: "nav.profile",
  dashboard: "nav.dashboard",
  users: "nav.users",
  roles: "nav.roles",
  onboarding: "nav.onboarding",
  documents: "nav.documents",
  requests: "nav.requests",
  point: "nav.point",
  admin: "nav.admin",
  "audit-logs": "nav.auditLogs",
  adjustments: "nav.adjustments",
  companies: "nav.companies",
  branches: "nav.branches",
  settings: "nav.settings",
};

export const ROUTE_PERMISSIONS: Record<string, string | string[]> = {
  "/profile": "dashboard.read",
  "/change-password": "dashboard.read",
  "/dashboard": "dashboard.read",
  "/users": "users.read",
  "/roles": ["admin.roles.manage", "admin.settings.read"],
  "/onboarding": "onboarding.read",
  "/documents": "documents.read",
  "/requests": "hr_requests.read",
  "/point": "point.read",
  "/point/adjustments": ["point.read", "point.adjust.request", "point.adjust.approve"],
  "/admin": "admin.settings.read",
  "/admin/companies": "admin.settings.update",
  "/admin/branches": ["admin.branches.read", "admin.branches.manage"],
  "/admin/settings": "admin.settings.update",
  "/audit-logs": "audit.read",
};
