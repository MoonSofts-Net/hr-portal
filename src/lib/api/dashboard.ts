import { apiRequest } from "./client";
import { isSuperAdmin } from "./auth";
import type { DashboardStats } from "@/types";
import type { RequestContext } from "./client";
import {
  MOCK_HR_REQUESTS,
  MOCK_ONBOARDING,
  MOCK_POINT_ADJUSTMENTS,
  MOCK_DOCUMENTS,
} from "@/mocks/seed";

export async function getDashboardStats(
  context: RequestContext,
  roleId: string
): Promise<DashboardStats> {
  return apiRequest(() => {
    if (isSuperAdmin(roleId)) {
      return {
        roleType: "super_admin",
        cards: [
          { id: "c1", label: "Companies", value: 2, href: "/admin/companies" },
          { id: "c2", label: "Active users", value: 4, href: "/users" },
          { id: "c3", label: "Roles", value: 4, href: "/roles" },
          { id: "c4", label: "Audit events (7d)", value: 12, href: "/audit-logs", variant: "default" },
        ],
      };
    }

    const hasHrPerms = context.userId === "user-hr" || roleId === "role-hr";
    const hasManagerPerms = roleId === "role-manager";

    if (hasHrPerms) {
      const pendingOnboarding = MOCK_ONBOARDING.filter(
        (o) => o.status === "under_review" || o.status === "submitted"
      ).length;
      const pendingDocs = MOCK_DOCUMENTS.filter((d) => d.status === "submitted").length;
      const openRequests = MOCK_HR_REQUESTS.filter(
        (r) => r.status === "open" || r.status === "in_progress"
      ).length;
      const pendingAdjustments = MOCK_POINT_ADJUSTMENTS.filter(
        (a) => a.status === "pending"
      ).length;

      return {
        roleType: "hr",
        cards: [
          { id: "c1", label: "Pending onboarding", value: pendingOnboarding, href: "/onboarding", variant: "warning" },
          { id: "c2", label: "Documents to validate", value: pendingDocs, href: "/documents" },
          { id: "c3", label: "Open HR requests", value: openRequests, href: "/requests" },
          { id: "c4", label: "Point adjustments", value: pendingAdjustments, href: "/point/adjustments", variant: "warning" },
        ],
      };
    }

    if (hasManagerPerms) {
      return {
        roleType: "manager",
        cards: [
          { id: "c1", label: "Team requests", value: 2, href: "/requests" },
          { id: "c2", label: "Adjustments to approve", value: 1, href: "/point/adjustments", variant: "warning" },
          { id: "c3", label: "Team onboarding", value: 1, href: "/onboarding" },
        ],
      };
    }

    return {
      roleType: "employee",
      cards: [
        { id: "c1", label: "Onboarding progress", value: "85%", href: "/onboarding" },
        { id: "c2", label: "Pending documents", value: +2, href: "/onboarding", variant: "warning" },
        { id: "c3", label: "Open requests", value: 2, href: "/requests" },
        { id: "c4", label: "Adjustment status", value: "Pending", href: "/point/adjustments" },
      ],
      recentItems: [
        {
          id: "r1",
          title: "Work card rejected",
          subtitle: "Please resubmit your document",
          status: "rejected",
          href: "/onboarding",
          date: "2026-05-19T15:00:00Z",
        },
      ],
    };
  }, context);
}
