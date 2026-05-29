export type JwtTokenType = 'access' | 'refresh' | 'password_reset';

export interface JwtAccessPayload {
  sub: string;
  email: string;
  homeTenantId: string;
  activeTenantId: string;
  roleId: string;
  sid: string;
  mfaVerified: boolean;
  type: 'access';
}

export interface JwtRefreshPayload {
  sub: string;
  sid: string;
  homeTenantId: string;
  activeTenantId: string;
  type: 'refresh';
}

export interface JwtPasswordResetPayload {
  sub: string;
  email: string;
  tenantId: string;
  type: 'password_reset';
}

export type JwtPayload = JwtAccessPayload | JwtRefreshPayload | JwtPasswordResetPayload;

export function isAccessPayload(payload: JwtPayload): payload is JwtAccessPayload {
  return payload.type === 'access';
}
