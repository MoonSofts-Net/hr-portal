import type { IconType } from "react-icons";
import { PlatformIcons } from "@/components/icons";
import { hasPermission } from "@/lib/permissions/check";

export interface NavItem {
  label: string;
  href: string;
  icon: IconType;
  permission?: string;
  permissions?: string[];
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: PlatformIcons.dashboard, permission: "dashboard.read" },
  { label: "Users", href: "/users", icon: PlatformIcons.users, permission: "users.read" },
  {
    label: "Roles",
    href: "/roles",
    icon: PlatformIcons.roles,
    permissions: ["admin.roles.manage", "admin.settings.read"],
  },
  { label: "Onboarding", href: "/onboarding", icon: PlatformIcons.onboarding, permission: "onboarding.read" },
  { label: "Documents", href: "/documents", icon: PlatformIcons.documents, permission: "documents.read" },
  { label: "HR Requests", href: "/requests", icon: PlatformIcons.requests, permission: "hr_requests.read" },
  {
    label: "Point",
    href: "/point",
    icon: PlatformIcons.point,
    permission: "point.read",
    children: [
      { label: "Mirror", href: "/point", icon: PlatformIcons.point, permission: "point.read" },
      {
        label: "Adjustments",
        href: "/point/adjustments",
        icon: PlatformIcons.calendar,
        permissions: ["point.read", "point.adjust.request", "point.adjust.approve"],
      },
    ],
  },
  {
    label: "Administration",
    href: "/admin",
    icon: PlatformIcons.admin,
    permission: "admin.settings.read",
    children: [
      { label: "Overview", href: "/admin", icon: PlatformIcons.admin, permission: "admin.settings.read" },
      {
        label: "Companies",
        href: "/admin/companies",
        icon: PlatformIcons.companies,
        permission: "admin.settings.update",
      },
      {
        label: "Settings",
        href: "/admin/settings",
        icon: PlatformIcons.admin,
        permission: "admin.settings.update",
      },
    ],
  },
  { label: "Audit Logs", href: "/audit-logs", icon: PlatformIcons.audit, permission: "audit.read" },
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

export const ROUTE_PERMISSIONS: Record<string, string | string[]> = {
  "/dashboard": "dashboard.read",
  "/users": "users.read",
  "/roles": ["admin.roles.manage", "admin.settings.read"],
  "/onboarding": "onboarding.read",
  "/documents": "documents.read",
  "/requests": "hr_requests.read",
  "/point": "point.read",
  "/point/adjustments": "point.read",
  "/admin": "admin.settings.read",
  "/admin/companies": "admin.settings.update",
  "/admin/settings": "admin.settings.update",
  "/audit-logs": "audit.read",
};
