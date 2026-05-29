# Portal RH API

Production-ready V1 backend for the HR Portal — modular NestJS monolith.

## Stack

- **NestJS 10** + TypeScript
- **PostgreSQL** + **Prisma ORM**
- **JWT** authentication (HttpOnly cookie-ready)
- **S3-compatible** document storage abstraction
- **Swagger** at `/docs`
- **Docker Compose** for API + PostgreSQL

## Quick start

**Terminal 1** — start PostgreSQL (no Docker required):

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npm run db:start
```

**Terminal 2** — schema + API:

```bash
cd backend
npm run db:setup    # first time only (migrate + seed)
npm run start:dev
```

See **[docs/DATABASE_SETUP.md](./docs/DATABASE_SETUP.md)** if you see `Can't reach database server at localhost:5432`.

- API: http://localhost:3001/api/v1  
- Swagger: http://localhost:3001/docs  
- Health: http://localhost:3001/api/v1/health  

## Docker

```bash
cp .env.example .env
docker compose up --build
```

Optional MinIO (local S3): `docker compose --profile storage up`

## Project structure

```
src/
  main.ts / app.module.ts
  config/                 # Environment configuration
  common/                 # Guards, filters, interceptors, decorators
  database/prisma/        # Prisma service
  storage/                # S3 abstraction
  security/               # Field encryption (CPF)
  integrations/           # GOV.BR, WhatsApp, payroll, AD placeholders
  modules/
    auth/ tenants/ users/ roles/ permissions/
    onboarding/ documents/ hr-requests/ point/
    notifications/ audit-logs/ admin/ health/
prisma/schema.prisma
prisma/DATABASE.md      # Migrations & seed
prisma/RLS.md           # Row Level Security guide
```

## Database

See **[prisma/DATABASE.md](./prisma/DATABASE.md)** for migrations and **[prisma/RLS.md](./prisma/RLS.md)** for PostgreSQL RLS.

**19 core models:** Tenant, User, Role, Permission, RolePermission, UserRole, EmployeeProfile, OnboardingProcess, OnboardingDocumentRequirement, OnboardingDocumentSubmission, Document, DocumentVersion, HRRequest, HRRequestMessage, Notification, PointRecord, PointAdjustmentRequest, AuditLog, SystemSetting (+ RefreshToken for auth).

## Security

- **TenantGuard** — JWT tenant + optional `x-tenant-id` header; blocks cross-tenant access
- **PermissionsGuard** — dynamic RBAC via `@RequirePermissions()`
- **AuditLogInterceptor** — mutating requests logged
- **CPF / phone / address** — on `EmployeeProfile` (`cpfEncrypted`, `cpfHash`, etc.)
- **RBAC** — `UserRole` junction; only Super Administrator is `isSystem` + `isGlobal`
- **Documents** — presigned URLs only via `GET /documents/:id/download-url`
- **RLS** — `setTenantContext()` sets `app.current_tenant_id` for PostgreSQL policies

## Auth & RBAC

See **[docs/AUTH.md](./docs/AUTH.md)** for full authentication, tenant context, and permission design.

```bash
POST /api/v1/auth/login
{ "identifier": "colaborador@moonsofts.com", "password": "colab123", "tenantSlug": "moonsofts" }

GET /api/v1/auth/me
Authorization: Bearer <accessToken>
```

| User | Password | tenantSlug |
|------|----------|------------|
| admin@portalrh.com | admin123 | system |
| rh@moonsofts.com | rh123 | moonsofts |
| gestor@moonsofts.com | gestor123 | moonsofts |
| colaborador@moonsofts.com | colab123 | moonsofts |

Global operators may pass `x-tenant-id: <uuid>` or call `POST /auth/select-tenant`.

## Frontend integration

Point the Next.js app `src/lib/api/*` to `http://localhost:3001/api/v1` and replace mock functions with HTTP calls.
