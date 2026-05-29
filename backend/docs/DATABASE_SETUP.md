# Database setup (local development)

The API requires **PostgreSQL**. Error `P1001: Can't reach database server at localhost:5432` means nothing is listening on that port.

## Option A — Embedded PostgreSQL (no Docker)

Best when Docker is not installed.

**Terminal 1** — keep running:

```bash
cd backend
npm run db:start
```

If you see `postmaster.pid already exists`, either PostgreSQL is already running (safe to use) or run:

```bash
npm run db:stop
npm run db:start
```

**Terminal 2** — first time only:

```bash
cd backend
npm run db:setup
npm run start:dev
```

Data is stored in `backend/data/postgres/`.

## Option B — Docker Compose

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
cd backend
docker compose up postgres -d
npm run db:setup
npm run start:dev
```

## Option C — Installed PostgreSQL

1. Install [PostgreSQL 16 for Windows](https://www.postgresql.org/download/windows/).
2. Create user and database matching `backend/.env`:

```sql
CREATE USER portal_rh WITH PASSWORD 'portal_rh_secret';
CREATE DATABASE portal_rh OWNER portal_rh;
```

3. Run `npm run db:setup` and `npm run start:dev`.

## Verify connection

```bash
npm run db:check
```

## Connection string

Default in `backend/.env`:

```
DATABASE_URL=postgresql://portal_rh:portal_rh_secret@localhost:5432/portal_rh?schema=public
```

If you use another port, update `DATABASE_URL` and `POSTGRES_PORT` when running `npm run db:start`.
