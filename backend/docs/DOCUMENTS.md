# Secure document management

## Architecture

| Layer | Responsibility |
|-------|----------------|
| PostgreSQL | Metadata, versions, status, access level, audit trail |
| Object storage | Binary files only (`StorageService`) |
| API | Auth, RBAC, validation, signed URLs |

**Never** persist or return permanent public object URLs.

## Storage providers

| `STORAGE_PROVIDER` | Implementation |
|--------------------|----------------|
| `local` | Files under `STORAGE_LOCAL_PATH` (default dev) |
| `s3` | S3-compatible stub (wire AWS SDK for production) |

### StorageService methods

- `uploadFile()` — tenant-scoped key `{tenantId}/documents/{documentId}/v{n}/{safeFilename}`
- `getSignedDownloadUrl()` — short-lived URL
- `deleteFile()` — remove object on soft-delete
- `copyFile()` — duplicate object
- `getMetadata()` — size / last modified

## Categories

`PERSONAL_DOCUMENT`, `CONTRACT`, `PAYSLIP`, `INTERNAL_COMMUNICATION`, `ONBOARDING`, `OTHER`

## Endpoints

| Method | Path | Permission |
|--------|------|------------|
| POST | `/documents/upload` | `documents.upload` |
| GET | `/documents` | `documents.read` |
| GET | `/documents/:id` | `documents.read` |
| POST | `/documents/:id/versions` | `documents.upload` |
| GET | `/documents/:id/versions` | `documents.read` |
| POST | `/documents/:id/request-download-url` | `documents.download` |
| POST | `/documents/:id/approve` | `documents.approve` |
| POST | `/documents/:id/reject` | `documents.approve` |
| DELETE | `/documents/:id` | `documents.upload` / HR approve |

## Security controls

- MIME allowlist + max size (`DOCUMENT_*` env vars)
- Filename sanitization (no path traversal)
- Virus scan abstraction (`NoOpVirusScannerService` — replace in prod)
- Access levels: `PRIVATE`, `HR`, `MANAGER`, `COMPANY`
- Employees see own documents unless HR/approve permissions
- Audit: `DOCUMENT_UPLOAD`, `DOCUMENT_DOWNLOAD`, `DOCUMENT_DELETE`, `APPROVAL`, `REJECTION`

## Upload example

```bash
curl -X POST http://localhost:3001/api/v1/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@rg.pdf" \
  -F "category=ONBOARDING" \
  -F "accessLevel=PRIVATE"
```

## Migration

After schema changes:

```bash
npx prisma migrate dev --name documents_secure_storage
```
