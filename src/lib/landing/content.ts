import type { IconType } from "react-icons";
import { PlatformIcons } from "@/components/icons";

export const LANDING_NAV = [
  { label: "Features", href: "#features" },
  { label: "Modules", href: "#modules" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Security", href: "#security" },
] as const;

export const LANDING_STATS = [
  { value: "4+", label: "Role-based dashboards" },
  { value: "11", label: "Core HR modules" },
  { value: "100%", label: "LGPD-ready audit trail" },
  { value: "Multi", label: "Tenant SaaS ready" },
] as const;

export interface LandingFeature {
  icon: IconType;
  title: string;
  description: string;
}

export const LANDING_FEATURES: LandingFeature[] = [
  {
    icon: PlatformIcons.onboarding,
    title: "Employee onboarding",
    description:
      "Guided admission flows, parametrizable document types, HR approval workflows, and real-time progress tracking.",
  },
  {
    icon: PlatformIcons.documents,
    title: "Document repository",
    description:
      "Secure upload, version history, category filters, and signed download URLs — never expose public file paths.",
  },
  {
    icon: PlatformIcons.requests,
    title: "HR communication",
    description:
      "Structured requests, threaded conversations, status lifecycle, and segmented views for HR teams.",
  },
  {
    icon: PlatformIcons.point,
    title: "Point mirror & adjustments",
    description:
      "Read-only time-sheet mirror from external systems with adjustment request and approval flows.",
  },
  {
    icon: PlatformIcons.users,
    title: "Users & dynamic roles",
    description:
      "Configurable permission matrix per tenant. Super Admin is fixed; HR, Manager, and Employee roles are fully customizable.",
  },
  {
    icon: PlatformIcons.audit,
    title: "Audit & compliance",
    description:
      "Filterable audit logs for login, downloads, approvals, permission changes, and cross-tenant prevention events.",
  },
];

export interface LandingModule {
  icon: IconType;
  title: string;
  description: string;
  tag: string;
}

export const LANDING_MODULES: LandingModule[] = [
  {
    icon: PlatformIcons.onboarding,
    title: "Onboarding",
    description: "RG, CPF, proof of address, work card, contracts — all configurable per company.",
    tag: "Admission",
  },
  {
    icon: PlatformIcons.documents,
    title: "Documents",
    description: "Personal, contracts, payslips, and internal communications with access indicators.",
    tag: "Repository",
  },
  {
    icon: PlatformIcons.requests,
    title: "HR requests",
    description: "Open → In progress → Waiting employee → Resolved → Closed.",
    tag: "Communication",
  },
  {
    icon: PlatformIcons.point,
    title: "Point",
    description: "Mirror viewing only in V1 — no direct clock-in. Adjustment requests for managers and HR.",
    tag: "Time",
  },
  {
    icon: PlatformIcons.companies,
    title: "Administration",
    description: "Companies, branding placeholders, settings, and operational governance.",
    tag: "SaaS",
  },
  {
    icon: PlatformIcons.shield,
    title: "Security layer",
    description: "Route guards, PermissionGuard, tenant context on every API call, CPF masking in UI.",
    tag: "LGPD",
  },
];

export const LANDING_STEPS = [
  {
    step: "01",
    title: "Configure your tenant",
    description: "Set up companies, roles, document types, and permission matrices for your organization.",
  },
  {
    step: "02",
    title: "Onboard employees",
    description: "Employees complete profiles, upload documents, and track onboarding status in one place.",
  },
  {
    step: "03",
    title: "Operate with confidence",
    description: "HR handles requests, validations, and audits while employees self-serve day-to-day needs.",
  },
] as const;
