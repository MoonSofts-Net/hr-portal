# Authentication, tenant context & RBAC

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | Public | Email or CPF + password |
| POST | `/auth/logout` | Bearer | Revokes refresh tokens + audit |
| POST | `/auth/forgot-password` | Public | Placeholder (generic response) |
| POST | `/auth/reset-password` | Public | Reset with JWT reset token |
| GET | `/auth/me` | Bearer | Safe profile + tenant + permissions |
| GET | `/auth/permissions` | Bearer | Permission IDs for session |
| POST | `/auth/select-tenant` | Bearer | Global operators switch tenant |

## Login

```json
POST /api/v1/auth/login
{
  "identifier": "colaborador@moonsofts.com",
  "password": "colab123",
  "tenantSlug": "moonsofts"
}
```

CPF login: pass digits-only or formatted CPF as `identifier` (lookup via `employee_profiles.cpf_hash`).

Response includes `accessToken`, `refreshToken`, `expiresIn`, and a safe `user` object (no password hash, no CPF).

## Tenant context

- **Normal users:** `activeTenantId` = home tenant. `x-tenant-id` header must match or be omitted.
- **Super Administrator (`isGlobal`):** may set `x-tenant-id` per request or call `POST /auth/select-tenant` to re-issue JWT with new `activeTenantId`.
- **Decorators:** `@CurrentTenant()` / `getCurrentTenant()`, `@CurrentUser()` / `getCurrentUser()`.
- **Guard order:** `RateLimitGuard` → `JwtAuthGuard` → `TenantGuard` → `PermissionsGuard`.

## Permissions (source of truth)

Defined in `src/security/permissions/permission-catalog.ts`:

- `users.read`, `users.create`, `users.update`
- `onboarding.read`, `onboarding.submit`, `onboarding.approve`, `onboarding.reject`
- `documents.read`, `documents.upload`, `documents.download`, `documents.approve`
- `hr_requests.read`, `hr_requests.create`, `hr_requests.respond`
- `point.read`, `point.adjust.request`, `point.adjust.approve`
- `admin.settings.read`, `admin.settings.update`, `admin.roles.manage`
- `audit.read`

Use `@RequirePermissions('users.read')` on handlers (OR semantics).

Super Administrator receives wildcard `*` plus all catalog IDs.

## MFA (future-ready)

- `User.mfaEnabled` in database.
- JWT payload includes `mfaVerified`.
- When MFA is enabled, V2 will return a challenge token from login; until then `mfaVerified` defaults to `true` if MFA is off.

## Rate limiting (placeholder)

`@RateLimit({ limit, windowMs, keyPrefix })` on login / forgot / reset — in-memory per IP. Replace with Redis or edge rate limiting in production.

## Security rules

- Passwords hashed with **bcrypt** (12 rounds) via `PasswordHasherService`.
- Refresh tokens stored as **SHA-256** hashes only.
- Password reset tokens are short-lived JWTs (`type: password_reset`).
- Sensitive fields never returned from `/auth/me`.
- Login / logout / password flows write **audit logs**.
