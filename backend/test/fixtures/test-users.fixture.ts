import { AuthenticatedUser } from '../../src/security/interfaces/authenticated-user.interface';

export const TENANT_A = 'tenant-a-id';
export const TENANT_B = 'tenant-b-id';

export const employeeTenantA: AuthenticatedUser = {
  userId: 'emp-a',
  email: 'colab@moonsofts.com',
  name: 'Colaborador A',
  homeTenantId: TENANT_A,
  activeTenantId: TENANT_A,
  tenantId: TENANT_A,
  roleId: 'role-employee',
  roleName: 'Employee',
  sessionId: 'session-emp-a',
  permissionIds: ['documents.read', 'documents.upload', 'documents.download', 'onboarding.read'],
  isSuperAdmin: false,
  isGlobal: false,
  mfaEnabled: false,
  mfaVerified: true,
};

export const hrTenantA: AuthenticatedUser = {
  userId: 'hr-a',
  email: 'rh@moonsofts.com',
  name: 'RH A',
  homeTenantId: TENANT_A,
  activeTenantId: TENANT_A,
  tenantId: TENANT_A,
  roleId: 'role-hr',
  roleName: 'HR',
  sessionId: 'session-hr-a',
  permissionIds: [
    'onboarding.approve',
    'documents.approve',
    'documents.download',
    'hr_requests.respond',
    'users.read',
  ],
  isSuperAdmin: false,
  isGlobal: false,
  mfaEnabled: false,
  mfaVerified: true,
};

export const managerTenantA: AuthenticatedUser = {
  userId: 'mgr-a',
  email: 'gestor@moonsofts.com',
  name: 'Gestor A',
  homeTenantId: TENANT_A,
  activeTenantId: TENANT_A,
  tenantId: TENANT_A,
  roleId: 'role-manager',
  roleName: 'Manager',
  sessionId: 'session-mgr-a',
  permissionIds: ['point.adjust.approve', 'documents.read'],
  isSuperAdmin: false,
  isGlobal: false,
  mfaEnabled: false,
  mfaVerified: true,
};

export const superAdmin: AuthenticatedUser = {
  userId: 'admin-sys',
  email: 'admin@portalrh.com',
  name: 'Super Admin',
  homeTenantId: 'tenant-system',
  activeTenantId: 'tenant-system',
  tenantId: 'tenant-system',
  roleId: 'role-super',
  roleName: 'Super Admin',
  sessionId: 'session-admin',
  permissionIds: ['*'],
  isSuperAdmin: true,
  isGlobal: true,
  mfaEnabled: false,
  mfaVerified: true,
};

export const employeeTenantB: AuthenticatedUser = {
  ...employeeTenantA,
  userId: 'emp-b',
  email: 'colab@other.com',
  homeTenantId: TENANT_B,
  activeTenantId: TENANT_B,
  tenantId: TENANT_B,
};
