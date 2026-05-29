# Portal RH — REST API V1

Base URL: `http://localhost:3001/api/v1`  
Swagger: `http://localhost:3001/docs`

## Response format

```json
{
  "success": true,
  "data": { },
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

List endpoints support `?page=1&limit=20&sortBy=createdAt&sortOrder=desc`.

## Modules

| Prefix | Description |
|--------|-------------|
| `/tenants` | Super Admin — company CRUD (soft delete) |
| `/users` | Tenant users + employee profiles (CPF masked in lists) |
| `/roles` | Dynamic roles + `POST /roles/:id/permissions` |
| `/permissions` | Global permission catalog |
| `/onboarding` | Employee onboarding workflow |
| `/hr-requests` | HR communication tickets + messages |
| `/point-records` | Read-only point mirror |
| `/point-adjustments` | Adjustment requests + approve/reject |
| `/audit-logs` | Append-only audit trail (filtered) |
| `/documents` | Secure upload, versions, signed download URLs — see [DOCUMENTS.md](./DOCUMENTS.md) |

## Headers

- `Authorization: Bearer <accessToken>`
- `x-tenant-id: <uuid>` — optional; global operators only

See [AUTH.md](./AUTH.md) for authentication details.
