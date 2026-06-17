import {
  apiRequest,
  apiFetch,
  clearTokens,
  getAccessToken,
  setTokens,
  useMockApi,
} from "./client";
import {
  MOCK_CREDENTIALS,
  MOCK_TENANTS,
  MOCK_USERS,
  getRolePermissions,
} from "@/mocks/seed";
import { normalizeCpf } from "@/lib/utils/cpf";
import type { AuthSession, User, UserStatus } from "@/types";
import { SUPER_ADMIN_ROLE_ID } from "@/lib/permissions/definitions";

export interface LoginInput {
  identifier: string;
  password: string;
  tenantSlug?: string;
}

export interface LoginResult {
  session: AuthSession;
  user: User;
  tenantName: string;
  requiresPasswordChange?: boolean;
}

const SESSION_KEY = "portal_rh_session_ref";

export function getStoredSessionRef(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_KEY);
}

export function setStoredSessionRef(ref: string): void {
  sessionStorage.setItem(SESSION_KEY, ref);
}

export function clearStoredSessionRef(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

let activeSession: { session: AuthSession; user: User } | null = null;

function mapBackendStatus(status: string): UserStatus {
  const s = status.toUpperCase();
  if (s === "ACTIVE") return "active";
  if (s === "DISABLED" || s === "SUSPENDED") return "inactive";
  return "pending";
}

function buildUserFromMe(data: {
  id: string;
  email: string;
  name: string;
  status: string;
  role: { id: string; name: string };
  activeTenant: { id: string; name: string };
  homeTenant?: { id: string };
}): User {
  return {
    id: data.id,
    tenantId: data.activeTenant.id,
    email: data.email,
    name: data.name,
    cpf: "",
    roleId: data.role.id,
    roleName: data.role.name,
    status: mapBackendStatus(data.status),
    createdAt: new Date().toISOString(),
  };
}

export async function login(input: LoginInput): Promise<LoginResult> {
  if (useMockApi()) {
    return apiRequest(() => {
      const id = input.identifier.trim().toLowerCase();
      const cpfNorm = normalizeCpf(input.identifier);

      const user = MOCK_USERS.find(
        (u) => u.email.toLowerCase() === id || normalizeCpf(u.cpf) === cpfNorm
      );

      if (!user) throw new Error("Invalid credentials");

      const password = MOCK_CREDENTIALS[user.email];
      if (password !== input.password) throw new Error("Invalid credentials");
      if (user.status !== "active") throw new Error("Account is not active");

      const permissionIds = getRolePermissions(user.roleId);
      const session: AuthSession = {
        userId: user.id,
        tenantId: user.tenantId,
        roleId: user.roleId,
        permissionIds,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        mfaPending: false,
      };

      activeSession = { session, user };
      setStoredSessionRef(user.id);

      const tenant = MOCK_TENANTS.find((t) => t.id === user.tenantId);
      return { session, user, tenantName: tenant?.name ?? "Unknown" };
    });
  }

  const data = await apiFetch<{
    accessToken: string;
    refreshToken: string;
    requiresMfa?: boolean;
    requiresPasswordChange?: boolean;
    user: {
      id: string;
      email: string;
      name: string;
      homeTenantId: string;
      activeTenantId: string;
      tenantName: string;
      roleName: string;
      mfaEnabled: boolean;
    };
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      identifier: input.identifier,
      password: input.password,
      tenantSlug: input.tenantSlug,
    }),
  });

  setTokens(data.accessToken, data.refreshToken, data.user.activeTenantId);

  const me = await apiFetch<{
    id: string;
    email: string;
    name: string;
    status: string;
    role: { id: string; name: string };
    activeTenant: { id: string; name: string };
    permissions: string[];
    mfaVerified: boolean;
    mfaEnabled: boolean;
    mustChangePassword?: boolean;
  }>("/auth/me", {
    headers: { Authorization: `Bearer ${data.accessToken}` },
  });

  const session: AuthSession = {
    userId: data.user.id,
    tenantId: data.user.activeTenantId,
    roleId: me.role.id,
    permissionIds: me.permissions,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    mfaPending: data.requiresMfa ?? false,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };

  const user = buildUserFromMe(me);
  user.roleName = me.role.name;

  activeSession = { session, user };
  setStoredSessionRef(user.id);

  return { session, user, tenantName: data.user.tenantName, requiresPasswordChange: data.requiresPasswordChange ?? me.mustChangePassword };
}

export async function logout(): Promise<void> {
  if (useMockApi()) {
    return apiRequest(() => {
      activeSession = null;
      clearStoredSessionRef();
      clearTokens();
    });
  }

  const refreshToken = typeof window !== "undefined" ? localStorage.getItem("portal_rh_refresh_token") : null;
  try {
    await apiFetch("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  } finally {
    activeSession = null;
    clearStoredSessionRef();
    clearTokens();
  }
}

export async function getCurrentSession(): Promise<{
  session: AuthSession;
  user: User;
  tenantName?: string;
  requiresPasswordChange?: boolean;
} | null> {
  if (useMockApi()) {
    return apiRequest(() => {
      if (activeSession) return activeSession;
      const ref = getStoredSessionRef();
      if (!ref) return null;
      const user = MOCK_USERS.find((u) => u.id === ref);
      if (!user) return null;
      const permissionIds = getRolePermissions(user.roleId);
      activeSession = {
        session: {
          userId: user.id,
          tenantId: user.tenantId,
          roleId: user.roleId,
          permissionIds,
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        },
        user,
      };
      const tenant = MOCK_TENANTS.find((t) => t.id === user.tenantId);
      return { ...activeSession, tenantName: tenant?.name ?? "" };
    });
  }

  const token = getAccessToken();
  if (!token) return null;

  try {
    const me = await apiFetch<{
      id: string;
      email: string;
      name: string;
      status: string;
      role: { id: string; name: string };
      activeTenant: { id: string; name: string };
      permissions: string[];
      mfaVerified: boolean;
      mfaEnabled: boolean;
      mustChangePassword?: boolean;
    }>("/auth/me");

    const user = buildUserFromMe(me);
    user.roleId = me.role.id;
    user.roleName = me.role.name;

    const session: AuthSession = {
      userId: me.id,
      tenantId: me.activeTenant.id,
      roleId: me.role.id,
      permissionIds: me.permissions,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      mfaPending: me.mfaEnabled && !me.mfaVerified,
      accessToken: token,
    };

    activeSession = { session, user };
    return {
      session,
      user,
      tenantName: me.activeTenant.name,
      requiresPasswordChange: me.mustChangePassword,
    };
  } catch {
    clearTokens();
    clearStoredSessionRef();
    return null;
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  if (useMockApi()) {
    return apiRequest(() => {
      void MOCK_USERS.some((u) => u.email.toLowerCase() === email.toLowerCase());
    });
  }

  await apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  if (useMockApi()) {
    return apiRequest(() => undefined);
  }

  await apiFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  if (useMockApi()) {
    return apiRequest(() => undefined);
  }

  await apiFetch("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function isSuperAdmin(roleId: string): boolean {
  return roleId === SUPER_ADMIN_ROLE_ID;
}
