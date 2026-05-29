/** Shared patterns for domain modules — extend per bounded context */

export const API_TAGS = {
  tenants: 'Tenants',
  users: 'Users',
  roles: 'Roles',
  permissions: 'Permissions',
  onboarding: 'Onboarding',
  documents: 'Documents',
  hrRequests: 'HR Requests',
  point: 'Point',
  notifications: 'Notifications',
  admin: 'Admin',
} as const;
