# Portal RH — HR Portal Frontend (V1)

Production-ready Next.js frontend for a corporate HR self-service portal.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn-style UI** (Radix primitives)
- **React Hook Form + Zod**
- **TanStack Query**
- **Zustand** (auth/session only)

## Repository layout

| Path | Description |
|------|-------------|
| `/` | Next.js frontend (Portal RH V1 UI) |
| `/backend` | NestJS REST API + Prisma + PostgreSQL |

## Getting started (full stack — one command)

From the project root:

```bash
cp .env.example .env
cd backend && cp .env.example .env && cd ..
npm install
cd backend && npm install && npm run db:setup && cd ..
npm run dev
```

This starts **PostgreSQL**, the **NestJS API** (port 3001), and the **Next.js frontend** (port 3000) in one terminal.

Stop everything:

```bash
npm run dev:stop
```

Open [http://localhost:3000/login](http://localhost:3000/login) to sign in.

## Getting started (frontend only)

```bash
cp .env.example .env
npm install
npm run dev:frontend
```

### Environment (`.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_USE_MOCK_API` | `true` = in-memory mocks (default if no API URL). `false` = call NestJS API |
| `NEXT_PUBLIC_API_URL` | Backend base URL, e.g. `http://localhost:3001/api/v1` |

Permission IDs in the UI match the backend catalog (`users.read`, `hr_requests.create`, `point.adjust.approve`, etc.).

## Getting started (backend)

See [backend/README.md](backend/README.md) for API setup, Docker, migrations, and seed data.

Open [http://localhost:3000](http://localhost:3000) — the **landing page** is the home route. Use **Access portal** or `/login` to sign in.

### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@portalrh.com | admin123 |
| HR | rh@moonsofts.com | rh123 |
| Manager | gestor@moonsofts.com | gestor123 |
| Employee | colaborador@moonsofts.com | colab123 |

## Architecture

```
src/
  app/           # Routes (auth + portal groups)
  components/    # UI, layout, guards, tables, forms
  features/      # Domain hooks/components (auth, roles)
  lib/           # API client, auth, permissions, validation
  mocks/         # Seed data
  types/         # Shared TypeScript types
```

- **API layer** in `src/lib/api/*` — mock mode by default; set `NEXT_PUBLIC_USE_MOCK_API=false` and `NEXT_PUBLIC_API_URL` to use the live backend (auth, users wired; other modules still mock-first).
- **Tenant context** passed on every API call via `RequestContext`.
- **Permissions** are dynamic per role (except Super Administrator system role).
- **No PII in localStorage** — only `sessionStorage` session reference; production should use HttpOnly cookies.

## Key routes

| Path | Module |
|------|--------|
| `/` | Marketing landing page |
| `/login` | Authentication |
| `/forgot-password` | Password reset |
| `/dashboard` | Role-based dashboard |
| `/users` | User management |
| `/roles` | Roles & permission matrix |
| `/onboarding` | Employee onboarding |
| `/documents` | Document repository |
| `/requests` | HR communication |
| `/point` | Point mirror (read-only) |
| `/point/adjustments` | Adjustment requests |
| `/admin` | Administration |
| `/audit-logs` | Audit trail (LGPD) |

## Backend integration

Replace mock functions in `src/lib/api/` with fetch calls to your API. Keep the same return types from `src/types/`.

Document downloads must use `requestSecureDownloadUrl()` — never expose permanent public file URLs.

## Build

```bash
npm run build
npm start
```
