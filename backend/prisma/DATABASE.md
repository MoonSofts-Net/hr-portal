# Portal RH — Database setup

## Prerequisites

- PostgreSQL 14+ (15+ recommended)
- Node.js 20+
- Docker (optional, for local Postgres)

## Quick start (local)

```bash
cd backend
cp .env.example .env
# Edit DATABASE_URL and FIELD_ENCRYPTION_KEY (32 chars)

docker compose up -d   # starts Postgres on 5432

npm install
npx prisma generate
npx prisma migrate dev --name init_portal_rh
npm run db:seed
```

## Commands

| Command | Purpose |
|---------|---------|
| `npx prisma generate` | Regenerate Prisma Client after schema changes |
| `npx prisma migrate dev` | Create & apply migration (development) |
| `npx prisma migrate deploy` | Apply migrations (CI/production) |
| `npx prisma db push` | Prototype only — avoid in production |
| `npm run db:seed` | Seed permissions, roles, demo tenant & users |
| `npx prisma studio` | Browse data in GUI |

## Fresh database

```bash
npx prisma migrate reset
# Drops DB, reapplies all migrations, runs seed (if configured in package.json)
```

## Production

1. Set `DATABASE_URL` to the managed Postgres instance (SSL required).
2. Run `npx prisma migrate deploy` in the release pipeline.
3. Run seed **once** for permissions catalog only, or use a dedicated bootstrap job — do not re-run demo users in production.
4. Enable RLS per `prisma/RLS.md` in a follow-up migration.
5. Rotate `FIELD_ENCRYPTION_KEY` only with a re-encryption migration plan.

## Seed accounts (development only)

| Email | Password | Tenant slug | Role |
|-------|----------|-------------|------|
| `admin@portalrh.com` | `admin123` | `system` | Super Administrator |
| `rh@moonsofts.com` | `rh123` | `moonsofts` | HR |
| `gestor@moonsofts.com` | `gestor123` | `moonsofts` | Manager |
| `colaborador@moonsofts.com` | `colab123` | `moonsofts` | Employee |

## Schema highlights

- **19 core entities** — see `schema.prisma`
- **`tenantId`** on every tenant-owned row
- **`UserRole`** — dynamic RBAC; only Super Administrator is fixed (`isSystem` + `isGlobal`)
- **`EmployeeProfile`** — CPF/phone/address encrypted fields
- **Documents** — metadata in DB; binary in S3 (`DocumentVersion.storageKey`)

## Troubleshooting

- **P1001**: Postgres not running — start Docker Compose or local service.
- **Unique constraint on seed**: run `migrate reset` or delete conflicting rows.
- **FIELD_ENCRYPTION_KEY**: must be exactly 32 characters (see `.env.example`).
