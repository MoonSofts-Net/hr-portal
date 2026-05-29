# PostgreSQL Row Level Security (RLS) — Portal RH

This schema is designed for **tenant isolation at the database layer**. Application guards (`TenantGuard`, JWT `tenantId`) are required today; RLS adds defense-in-depth so a misconfigured query cannot read another tenant’s rows.

## Session context

Before each request (or inside a Prisma middleware / `$executeRaw` transaction), set:

```sql
SELECT set_config('app.current_tenant_id', '<uuid>', true);
SELECT set_config('app.is_super_admin', 'false', true);
```

For Super Administrator with `Role.isGlobal = true`:

```sql
SELECT set_config('app.is_super_admin', 'true', true);
```

`PrismaService.setTenantContext(tenantId)` should call the first statement. Extend it for `is_super_admin` when the authenticated user has a global role.

## Tables to protect

Enable RLS on all tenant-owned tables:

| Table | Policy expression (tenant users) |
|-------|----------------------------------|
| `users` | `tenant_id = current_setting('app.current_tenant_id')::uuid` |
| `user_roles` | same |
| `employee_profiles` | same |
| `roles` | `tenant_id IS NULL OR tenant_id = current_setting(...)` |
| `onboarding_processes` | same |
| `onboarding_document_requirements` | same |
| `onboarding_document_submissions` | same |
| `documents` | same |
| `document_versions` | via join: `document_id IN (SELECT id FROM documents WHERE tenant_id = ...)` |
| `hr_requests` | `tenant_id = ...` |
| `hr_request_messages` | same |
| `notifications` | same |
| `point_records` | same |
| `point_adjustment_requests` | same |
| `audit_logs` | same |
| `system_settings` | `scope = 'GLOBAL' AND tenant_id IS NULL` OR `tenant_id = ...` |
| `refresh_tokens` | same |

**Global catalog (no RLS on tenant column):** `permissions`, `role_permissions` (enforce via `roles.tenant_id` in app layer or policy join).

## Example policies (apply in a dedicated migration)

See `prisma/sql/rls_policies.example.sql`.

### Super admin bypass

```sql
CREATE POLICY tenant_isolation ON users
  USING (
    current_setting('app.is_super_admin', true) = 'true'
    OR tenant_id = current_setting('app.current_tenant_id', true)::uuid
  );
```

### INSERT / UPDATE

Use the same `USING` expression for `WITH CHECK` on INSERT/UPDATE so new rows cannot set a foreign `tenant_id`.

## Prisma notes

- Prisma uses a single DB role by default; RLS applies to that role.
- Use `$executeRaw` to set `app.current_tenant_id` at the start of interactive transactions.
- For connection pooling (PgBouncer transaction mode), set context **per transaction**, not per connection at pool checkout.
- Migrations that seed data may need `SET row_security = off` for the migration role or use a superuser migration account.

## Testing RLS

1. Set tenant A context → `SELECT * FROM users` returns only tenant A.
2. Set tenant B context → no rows from tenant A.
3. Set `app.is_super_admin = true` → all tenants (audit carefully).

## Sensitive columns

RLS does **not** replace field-level encryption. `employee_profiles.cpf_encrypted`, `phone_encrypted`, and `address_encrypted` must still be encrypted/masked in the application layer.
