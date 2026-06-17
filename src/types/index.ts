/** Core domain types for Portal RH V1 */

export type UserStatus = "active" | "inactive" | "pending";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  isActive: boolean;
}

export interface Branch {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  legalName?: string;
  taxId?: string;
  address?: string;
  city?: string;
  state?: string;
  isContracted: boolean;
  isActive: boolean;
  userCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface BranchSummary {
  id: string;
  code: string;
  name: string;
}

export type PermissionModule =
  | "dashboard"
  | "users"
  | "onboarding"
  | "documents"
  | "communication"
  | "point"
  | "branches"
  | "administration"
  | "audit";

export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "approve"
  | "reject"
  | "download"
  | "upload"
  | "manage";

export interface Permission {
  id: string;
  module: PermissionModule;
  action: PermissionAction;
  label: string;
}

export interface Role {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissionIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  cpf: string;
  name: string;
  roleId: string;
  roleName: string;
  branchId?: string;
  branchName?: string;
  branchCode?: string;
  department?: string;
  status: UserStatus;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  tenantId: string;
  roleId: string;
  permissionIds: string[];
  expiresAt: string;
  mfaPending?: boolean;
  accessToken?: string;
  refreshToken?: string;
}

export type DocumentCategory =
  | "personal"
  | "contracts"
  | "payslips"
  | "internal"
  | "other";

export type DocumentUploadStatus =
  | "pending"
  | "submitted"
  | "approved"
  | "rejected";

export interface DocumentTypeConfig {
  id: string;
  tenantId: string;
  code: string;
  label: string;
  required: boolean;
  category: DocumentCategory;
}

export interface Document {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  category: DocumentCategory;
  documentTypeId?: string;
  version: number;
  status: DocumentUploadStatus;
  uploadedAt: string;
  rejectionReason?: string;
  accessLevel: "private" | "hr" | "manager" | "company";
}

export type OnboardingStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected";

export interface OnboardingSubmission {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  status: OnboardingStatus;
  progressPercent: number;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  personalInfo: {
    fullName: string;
    birthDate: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  documents: OnboardingDocumentItem[];
  timeline: OnboardingTimelineEvent[];
}

export interface OnboardingDocumentItem {
  documentTypeId: string;
  documentTypeLabel: string;
  status: DocumentUploadStatus;
  documentId?: string;
  rejectionReason?: string;
}

export interface OnboardingTimelineEvent {
  id: string;
  type: "submitted" | "approved" | "rejected" | "comment" | "upload";
  message: string;
  createdAt: string;
  actorName?: string;
}

export type HRRequestStatus =
  | "open"
  | "in_progress"
  | "waiting_employee"
  | "resolved"
  | "closed";

export interface HRRequest {
  id: string;
  tenantId: string;
  requesterId: string;
  requesterName: string;
  subject: string;
  category: string;
  status: HRRequestStatus;
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  messages: HRRequestMessage[];
}

export interface HRRequestMessage {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
}

export interface PointRecord {
  id: string;
  tenantId: string;
  userId: string;
  date: string;
  entries: PointEntry[];
  totalHours: string;
  status: "normal" | "incomplete" | "holiday" | "absence";
}

export interface PointEntry {
  type: "in" | "out" | "break_start" | "break_end";
  time: string;
}

export type PointAdjustmentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export interface PointAdjustmentRequest {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  date: string;
  reason: string;
  requestedChanges: string;
  status: PointAdjustmentStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewComment?: string;
}

export type AuditAction =
  | "login"
  | "logout"
  | "document_upload"
  | "document_download"
  | "approval"
  | "rejection"
  | "permission_update"
  | "user_create"
  | "user_update"
  | "cross_tenant_blocked"
  | "settings_update";

export interface AuditLog {
  id: string;
  tenantId: string;
  tenantName: string;
  userId: string;
  userName: string;
  module: PermissionModule | "auth";
  action: AuditAction;
  resource?: string;
  ipAddress?: string;
  metadata?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  category: string;
  messageKey: string;
  actorUserId?: string;
  metadata?: Record<string, unknown>;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface DashboardStats {
  roleType: "employee" | "hr" | "manager" | "super_admin";
  cards: DashboardCard[];
  recentItems?: DashboardRecentItem[];
}

export interface DashboardCard {
  id: string;
  label: string;
  value: number | string;
  description?: string;
  href?: string;
  variant?: "default" | "warning" | "success" | "danger";
}

export interface DashboardRecentItem {
  id: string;
  title: string;
  subtitle: string;
  status?: string;
  href?: string;
  date: string;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
