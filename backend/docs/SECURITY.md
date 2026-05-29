# Portal RH — Security Model

## Layers

1. **Transport** — Helmet security headers, CORS allowlist, request body size limits (`HTTP_BODY_LIMIT`, default `1mb`).
2. **Rate limiting** — Global `@nestjs/throttler` (120 req/min) plus `@RateLimit()` on sensitive routes (e.g. login).
3. **Authentication** — JWT access + refresh tokens; bcrypt password hashing; optional MFA flag on session.
4. **Tenant isolation** — `TenantGuard` binds `req.tenantId`; non-global users cannot use `x-tenant-id` to access another tenant (logged as `CROSS_TENANT_ACCESS_ATTEMPT`).
5. **Authorization** — `PermissionsGuard` + `@RequirePermissions()`; permission IDs are the source of truth (e.g. `documents.download`, `onboarding.approve`).
6. **Data access** — All tenant-owned Prisma queries include `tenantId`; document access uses `DocumentAccessService` (owner / HR / manager levels).
7. **Audit** — `DomainAuditService.recordEvent()` writes append-only `audit_logs` with masked metadata.
8. **Errors** — `HttpExceptionFilter` returns `{ success: false, ... }` without stack traces in production.

## Tenant isolation strategy

- Every user has a **home tenant** (`User.tenantId`).
- JWT carries `homeTenantId` and `activeTenantId`.
- Regular users: `activeTenantId` is always forced to `homeTenantId`.
- **Super Admin** (`Role.isSystem` + `isGlobal`): may pass `x-tenant-id` or call `POST /auth/select-tenant` to operate in another tenant.
- Prisma helpers: `tenantWhere(tenantId, filters)` and `setTenantContext()` prepare for PostgreSQL RLS.
- Cross-tenant attempts are denied with **403** and audited.

## Audit events

Canonical keys live in `src/modules/audit-logs/audit-event.catalog.ts` (login, users, roles, onboarding, documents, HR requests, point adjustments, tenants).

Fields: `tenantId`, `actorUserId`, `targetUserId`, `module`, `action`, `entityType`, `entityId`, `ipAddress`, `userAgent`, `metadata`, `createdAt`.

## Connecting the frontend

1. Set `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1` (or your deployed API).
2. After login, store `accessToken` (and `refreshToken` if using body tokens).
3. Send on every request:
   - `Authorization: Bearer <accessToken>`
   - `Content-Type: application/json` (or `multipart/form-data` for uploads)
4. **Super Admin only:** `x-tenant-id: <uuid>` when acting in a client tenant.
5. Handle `{ success: false, message, statusCode }` error shape from the API.
6. Map UI permission checks to the same IDs returned by `GET /auth/permissions` (backend still enforces via guards).

Example:

```typescript
const res = await fetch(`${API_URL}/users`, {
  headers: {
    Authorization: `Bearer ${token}`,
    ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
  },
});
const json = await res.json();
if (!json.success) throw new Error(json.message);
```

## Environment validation

Startup validates `DATABASE_URL`, JWT secrets (min 32 chars), `FIELD_ENCRYPTION_KEY`, `NODE_ENV`, and optional storage/CORS settings via `validateEnv` in `config/env.validation.ts`.

## Tests

```bash
cd backend
npm test              # unit + integration (*.spec.ts)
npm run test:e2e      # security.integration.spec.ts
```

Fixtures: `test/fixtures/test-users.fixture.ts`.
