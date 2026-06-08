import type {
  AuditLog,
  Document,
  DocumentTypeConfig,
  HRRequest,
  Notification,
  OnboardingSubmission,
  PointAdjustmentRequest,
  PointRecord,
  Role,
  Tenant,
  User,
} from "@/types";
import { PERMISSION_DEFINITIONS, SUPER_ADMIN_ROLE_ID } from "@/lib/permissions/definitions";
import {
  ROLE_EMPLOYEE_ID,
  ROLE_HR_ID,
  ROLE_MANAGER_ID,
  TENANT_MOONSOFTS_ID,
} from "@/lib/constants/ids";

export const MOCK_TENANTS: Tenant[] = [
  { id: TENANT_MOONSOFTS_ID, name: "Moonsofts Tecnologia", slug: "moonsofts", isActive: true },
  { id: "tenant-2", name: "Acme Brasil Ltda", slug: "acme", isActive: true },
];

const allPermissionIds = PERMISSION_DEFINITIONS.map((p) => p.id);

export const MOCK_ROLES: Role[] = [
  {
    id: SUPER_ADMIN_ROLE_ID,
    tenantId: "*",
    name: "Super Administrator",
    description: "Full system access across tenants",
    isSystem: true,
    permissionIds: ["*"],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: ROLE_HR_ID,
    tenantId: TENANT_MOONSOFTS_ID,
    name: "HR",
    description: "Human Resources team",
    isSystem: false,
    permissionIds: [
      "dashboard.read",
      "users.read",
      "users.create",
      "users.update",
      "onboarding.read",
      "onboarding.approve",
      "onboarding.reject",
      "documents.read",
      "documents.upload",
      "documents.download",
      "documents.approve",
      "hr_requests.read",
      "hr_requests.respond",
      "point.read",
      "point.adjust.approve",
      "audit.read",
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
  },
  {
    id: ROLE_MANAGER_ID,
    tenantId: TENANT_MOONSOFTS_ID,
    name: "Manager",
    description: "Team manager",
    isSystem: false,
    permissionIds: [
      "dashboard.read",
      "users.read",
      "onboarding.read",
      "documents.read",
      "hr_requests.read",
      "hr_requests.respond",
      "point.read",
      "point.adjust.approve",
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
  },
  {
    id: ROLE_EMPLOYEE_ID,
    tenantId: TENANT_MOONSOFTS_ID,
    name: "Employee",
    description: "Standard employee access",
    isSystem: false,
    permissionIds: [
      "dashboard.read",
      "onboarding.read",
      "onboarding.submit",
      "documents.read",
      "documents.upload",
      "documents.download",
      "hr_requests.read",
      "hr_requests.create",
      "point.read",
      "point.adjust.request",
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
  },
];

export const MOCK_USERS: User[] = [
  {
    id: "user-super",
    tenantId: TENANT_MOONSOFTS_ID,
    email: "admin@portalrh.com",
    cpf: "12345678901",
    name: "Ana Super Admin",
    roleId: SUPER_ADMIN_ROLE_ID,
    roleName: "Super Administrator",
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
    lastLoginAt: "2026-05-28T08:00:00Z",
  },
  {
    id: "user-hr",
    tenantId: TENANT_MOONSOFTS_ID,
    email: "rh@moonsofts.com",
    cpf: "98765432100",
    name: "Carlos RH",
    roleId: ROLE_HR_ID,
    roleName: "HR",
    department: "Human Resources",
    status: "active",
    createdAt: "2024-02-01T00:00:00Z",
    lastLoginAt: "2026-05-27T17:30:00Z",
  },
  {
    id: "user-manager",
    tenantId: TENANT_MOONSOFTS_ID,
    email: "gestor@moonsofts.com",
    cpf: "11122233344",
    name: "Beatriz Gestora",
    roleId: ROLE_MANAGER_ID,
    roleName: "Manager",
    department: "Engineering",
    status: "active",
    createdAt: "2024-03-01T00:00:00Z",
  },
  {
    id: "user-employee",
    tenantId: TENANT_MOONSOFTS_ID,
    email: "colaborador@moonsofts.com",
    cpf: "55566677788",
    name: "Diego Colaborador",
    roleId: ROLE_EMPLOYEE_ID,
    roleName: "Employee",
    department: "Engineering",
    status: "active",
    createdAt: "2024-04-01T00:00:00Z",
  },
];

/** Demo passwords keyed by email (mock only — never use in production) */
export const MOCK_CREDENTIALS: Record<string, string> = {
  "admin@portalrh.com": "admin123",
  "rh@moonsofts.com": "rh123",
  "gestor@moonsofts.com": "gestor123",
  "colaborador@moonsofts.com": "colab123",
};

export const MOCK_DOCUMENT_TYPES: DocumentTypeConfig[] = [
  { id: "dt-rg", tenantId: TENANT_MOONSOFTS_ID, code: "RG", label: "RG (Identity)", required: true, category: "personal" },
  { id: "dt-cpf", tenantId: TENANT_MOONSOFTS_ID, code: "CPF", label: "CPF", required: true, category: "personal" },
  { id: "dt-address", tenantId: TENANT_MOONSOFTS_ID, code: "ADDRESS", label: "Proof of address", required: true, category: "personal" },
  { id: "dt-workcard", tenantId: TENANT_MOONSOFTS_ID, code: "WORK_CARD", label: "Work card", required: true, category: "personal" },
  { id: "dt-contract", tenantId: TENANT_MOONSOFTS_ID, code: "CONTRACT", label: "Contract", required: false, category: "contracts" },
  { id: "dt-other", tenantId: TENANT_MOONSOFTS_ID, code: "OTHER", label: "Other", required: false, category: "other" },
];

export const MOCK_DOCUMENTS: Document[] = [
  {
    id: "doc-1",
    tenantId: TENANT_MOONSOFTS_ID,
    userId: "user-employee",
    name: "RG - Diego Colaborador.pdf",
    category: "personal",
    documentTypeId: "dt-rg",
    version: 1,
    status: "approved",
    uploadedAt: "2025-01-15T10:00:00Z",
    accessLevel: "hr",
  },
  {
    id: "doc-2",
    tenantId: TENANT_MOONSOFTS_ID,
    userId: "user-employee",
    name: "Holerite Março 2026.pdf",
    category: "payslips",
    version: 1,
    status: "approved",
    uploadedAt: "2026-03-05T09:00:00Z",
    accessLevel: "private",
  },
];

export const MOCK_ONBOARDING: OnboardingSubmission[] = [
  {
    id: "onb-1",
    tenantId: TENANT_MOONSOFTS_ID,
    userId: "user-employee",
    userName: "Diego Colaborador",
    status: "under_review",
    progressPercent: 85,
    submittedAt: "2026-05-20T14:00:00Z",
    personalInfo: {
      fullName: "Diego Colaborador",
      birthDate: "1990-05-15",
      phone: "(11) 99999-0000",
      address: "Rua Example, 100",
      city: "São Paulo",
      state: "SP",
      zipCode: "01000-000",
    },
    documents: [
      { documentTypeId: "dt-rg", documentTypeLabel: "RG (Identity)", status: "approved", documentId: "doc-1" },
      { documentTypeId: "dt-cpf", documentTypeLabel: "CPF", status: "submitted" },
      { documentTypeId: "dt-address", documentTypeLabel: "Proof of address", status: "pending" },
      { documentTypeId: "dt-workcard", documentTypeLabel: "Work card", status: "rejected", rejectionReason: "Image illegible" },
    ],
    timeline: [
      { id: "t1", type: "upload", message: "RG uploaded", createdAt: "2026-05-18T10:00:00Z", actorName: "Diego Colaborador" },
      { id: "t2", type: "approved", message: "RG approved", createdAt: "2026-05-19T11:00:00Z", actorName: "Carlos RH" },
      { id: "t3", type: "rejected", message: "Work card rejected: Image illegible", createdAt: "2026-05-19T15:00:00Z", actorName: "Carlos RH" },
      { id: "t4", type: "submitted", message: "Onboarding submitted for review", createdAt: "2026-05-20T14:00:00Z", actorName: "Diego Colaborador" },
    ],
  },
];

export const MOCK_HR_REQUESTS: HRRequest[] = [
  {
    id: "req-1",
    tenantId: TENANT_MOONSOFTS_ID,
    requesterId: "user-employee",
    requesterName: "Diego Colaborador",
    subject: "Vacation balance inquiry",
    category: "Benefits",
    status: "in_progress",
    priority: "medium",
    createdAt: "2026-05-25T09:00:00Z",
    updatedAt: "2026-05-26T14:00:00Z",
    assignedTo: "user-hr",
    messages: [
      {
        id: "m1",
        authorId: "user-employee",
        authorName: "Diego Colaborador",
        body: "Hello, I would like to know my remaining vacation days.",
        isInternal: false,
        createdAt: "2026-05-25T09:00:00Z",
      },
      {
        id: "m2",
        authorId: "user-hr",
        authorName: "Carlos RH",
        body: "Hi Diego, we are checking your balance and will reply shortly.",
        isInternal: false,
        createdAt: "2026-05-26T14:00:00Z",
      },
    ],
  },
  {
    id: "req-2",
    tenantId: TENANT_MOONSOFTS_ID,
    requesterId: "user-employee",
    requesterName: "Diego Colaborador",
    subject: "Update bank details",
    category: "Payroll",
    status: "open",
    priority: "high",
    createdAt: "2026-05-27T11:00:00Z",
    updatedAt: "2026-05-27T11:00:00Z",
    messages: [
      {
        id: "m3",
        authorId: "user-employee",
        authorName: "Diego Colaborador",
        body: "I need to update my bank account for payroll.",
        isInternal: false,
        createdAt: "2026-05-27T11:00:00Z",
      },
    ],
  },
];

export const MOCK_POINT_RECORDS: PointRecord[] = [
  {
    id: "pt-1",
    tenantId: TENANT_MOONSOFTS_ID,
    userId: "user-employee",
    date: "2026-05-26",
    entries: [
      { type: "in", time: "09:02" },
      { type: "break_start", time: "12:00" },
      { type: "break_end", time: "13:00" },
      { type: "out", time: "18:05" },
    ],
    totalHours: "08:03",
    status: "normal",
  },
  {
    id: "pt-2",
    tenantId: TENANT_MOONSOFTS_ID,
    userId: "user-employee",
    date: "2026-05-27",
    entries: [
      { type: "in", time: "09:15" },
      { type: "out", time: "17:00" },
    ],
    totalHours: "07:45",
    status: "incomplete",
  },
];

export const MOCK_POINT_ADJUSTMENTS: PointAdjustmentRequest[] = [
  {
    id: "adj-1",
    tenantId: TENANT_MOONSOFTS_ID,
    userId: "user-employee",
    userName: "Diego Colaborador",
    date: "2026-05-27",
    reason: "Forgot to register break return",
    requestedChanges: "Add break_end at 13:00 and out at 18:00",
    status: "pending",
    createdAt: "2026-05-28T08:30:00Z",
  },
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: "audit-1",
    tenantId: TENANT_MOONSOFTS_ID,
    tenantName: "Moonsofts Tecnologia",
    userId: "user-hr",
    userName: "Carlos RH",
    module: "auth",
    action: "login",
    ipAddress: "192.168.1.10",
    createdAt: "2026-05-28T08:00:00Z",
  },
  {
    id: "audit-2",
    tenantId: TENANT_MOONSOFTS_ID,
    tenantName: "Moonsofts Tecnologia",
    userId: "user-employee",
    userName: "Diego Colaborador",
    module: "documents",
    action: "document_upload",
    resource: "doc-1",
    createdAt: "2026-05-27T16:00:00Z",
  },
  {
    id: "audit-3",
    tenantId: TENANT_MOONSOFTS_ID,
    tenantName: "Moonsofts Tecnologia",
    userId: "user-hr",
    userName: "Carlos RH",
    module: "onboarding",
    action: "approval",
    resource: "onb-1 / RG",
    createdAt: "2026-05-19T11:00:00Z",
  },
  {
    id: "audit-4",
    tenantId: TENANT_MOONSOFTS_ID,
    tenantName: "Moonsofts Tecnologia",
    userId: "user-super",
    userName: "Ana Super Admin",
    module: "administration",
    action: "permission_update",
    resource: ROLE_HR_ID,
    metadata: "Added documents.manage",
    createdAt: "2026-05-15T10:00:00Z",
  },
  {
    id: "audit-5",
    tenantId: TENANT_MOONSOFTS_ID,
    tenantName: "Moonsofts Tecnologia",
    userId: "user-super",
    userName: "Ana Super Admin",
    module: "auth",
    action: "cross_tenant_blocked",
    metadata: "Attempted access to tenant-2 without scope",
    createdAt: "2026-05-10T09:00:00Z",
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    tenantId: TENANT_MOONSOFTS_ID,
    userId: "user-employee",
    title: "Document rejected",
    body: "Your work card upload was rejected. Please resubmit.",
    read: false,
    createdAt: "2026-05-19T15:00:00Z",
    link: "/onboarding",
  },
  {
    id: "notif-2",
    tenantId: TENANT_MOONSOFTS_ID,
    userId: "user-hr",
    title: "New onboarding submission",
    body: "Diego Colaborador submitted onboarding for review.",
    read: false,
    createdAt: "2026-05-20T14:00:00Z",
    link: "/onboarding/review/onb-1",
  },
];

export function getRolePermissions(roleId: string): string[] {
  const role = MOCK_ROLES.find((r) => r.id === roleId);
  return role?.permissionIds ?? [];
}

export function getAllPermissionIdsForDemo(): string[] {
  return allPermissionIds;
}
