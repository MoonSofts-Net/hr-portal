import { AuditAction, PermissionModule } from '@prisma/client';

export interface AuditEventDefinition {
  action: AuditAction;
  module: PermissionModule;
  entityType: string;
}

/** Canonical audit events — use with AuditService.recordEvent() */
export const AuditEvents = {
  LOGIN_SUCCESS: {
    action: AuditAction.LOGIN_SUCCESS,
    module: PermissionModule.ADMINISTRATION,
    entityType: 'session',
  },
  LOGIN_FAILURE: {
    action: AuditAction.LOGIN_FAILURE,
    module: PermissionModule.ADMINISTRATION,
    entityType: 'session',
  },
  LOGOUT: {
    action: AuditAction.LOGOUT,
    module: PermissionModule.ADMINISTRATION,
    entityType: 'session',
  },
  PASSWORD_RESET_REQUEST: {
    action: AuditAction.PASSWORD_RESET_REQUEST,
    module: PermissionModule.ADMINISTRATION,
    entityType: 'user',
  },
  USER_CREATED: {
    action: AuditAction.USER_CREATED,
    module: PermissionModule.USERS,
    entityType: 'user',
  },
  USER_UPDATED: {
    action: AuditAction.USER_UPDATED,
    module: PermissionModule.USERS,
    entityType: 'user',
  },
  USER_DISABLED: {
    action: AuditAction.USER_DISABLED,
    module: PermissionModule.USERS,
    entityType: 'user',
  },
  ROLE_CREATED: {
    action: AuditAction.ROLE_CREATED,
    module: PermissionModule.ADMINISTRATION,
    entityType: 'role',
  },
  ROLE_UPDATED: {
    action: AuditAction.ROLE_UPDATED,
    module: PermissionModule.ADMINISTRATION,
    entityType: 'role',
  },
  PERMISSION_CHANGED: {
    action: AuditAction.PERMISSION_CHANGED,
    module: PermissionModule.ADMINISTRATION,
    entityType: 'role',
  },
  ONBOARDING_SUBMITTED: {
    action: AuditAction.ONBOARDING_SUBMITTED,
    module: PermissionModule.ONBOARDING,
    entityType: 'onboarding',
  },
  ONBOARDING_APPROVED: {
    action: AuditAction.ONBOARDING_APPROVED,
    module: PermissionModule.ONBOARDING,
    entityType: 'onboarding',
  },
  ONBOARDING_REJECTED: {
    action: AuditAction.ONBOARDING_REJECTED,
    module: PermissionModule.ONBOARDING,
    entityType: 'onboarding',
  },
  DOCUMENT_UPLOADED: {
    action: AuditAction.DOCUMENT_UPLOADED,
    module: PermissionModule.DOCUMENTS,
    entityType: 'document',
  },
  DOCUMENT_DOWNLOADED: {
    action: AuditAction.DOCUMENT_DOWNLOADED,
    module: PermissionModule.DOCUMENTS,
    entityType: 'document',
  },
  DOCUMENT_APPROVED: {
    action: AuditAction.DOCUMENT_APPROVED,
    module: PermissionModule.DOCUMENTS,
    entityType: 'document',
  },
  DOCUMENT_REJECTED: {
    action: AuditAction.DOCUMENT_REJECTED,
    module: PermissionModule.DOCUMENTS,
    entityType: 'document',
  },
  DOCUMENT_DELETED: {
    action: AuditAction.DOCUMENT_DELETED,
    module: PermissionModule.DOCUMENTS,
    entityType: 'document',
  },
  HR_REQUEST_CREATED: {
    action: AuditAction.HR_REQUEST_CREATED,
    module: PermissionModule.COMMUNICATION,
    entityType: 'hr_request',
  },
  HR_REQUEST_STATUS_CHANGED: {
    action: AuditAction.HR_REQUEST_STATUS_CHANGED,
    module: PermissionModule.COMMUNICATION,
    entityType: 'hr_request',
  },
  POINT_ADJUSTMENT_REQUESTED: {
    action: AuditAction.POINT_ADJUSTMENT_REQUESTED,
    module: PermissionModule.POINT,
    entityType: 'point_adjustment',
  },
  POINT_ADJUSTMENT_APPROVED: {
    action: AuditAction.POINT_ADJUSTMENT_APPROVED,
    module: PermissionModule.POINT,
    entityType: 'point_adjustment',
  },
  POINT_ADJUSTMENT_REJECTED: {
    action: AuditAction.POINT_ADJUSTMENT_REJECTED,
    module: PermissionModule.POINT,
    entityType: 'point_adjustment',
  },
  TENANT_CREATED: {
    action: AuditAction.TENANT_CREATED,
    module: PermissionModule.ADMINISTRATION,
    entityType: 'tenant',
  },
  TENANT_UPDATED: {
    action: AuditAction.TENANT_UPDATED,
    module: PermissionModule.ADMINISTRATION,
    entityType: 'tenant',
  },
  BRANCH_CREATED: {
    action: AuditAction.BRANCH_CREATED,
    module: PermissionModule.BRANCHES,
    entityType: 'branch',
  },
  BRANCH_UPDATED: {
    action: AuditAction.BRANCH_UPDATED,
    module: PermissionModule.BRANCHES,
    entityType: 'branch',
  },
  CROSS_TENANT_ACCESS_ATTEMPT: {
    action: AuditAction.CROSS_TENANT_ACCESS_ATTEMPT,
    module: PermissionModule.ADMINISTRATION,
    entityType: 'tenant',
  },
} as const satisfies Record<string, AuditEventDefinition>;

export type AuditEventKey = keyof typeof AuditEvents;
