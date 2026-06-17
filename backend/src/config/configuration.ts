export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3001', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  appUrl: process.env.APP_URL ?? process.env.CORS_ORIGIN ?? 'http://localhost:3000',

  http: {
    bodyLimit: process.env.HTTP_BODY_LIMIT ?? '1mb',
  },

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    useHttpOnlyCookies: process.env.AUTH_USE_HTTP_ONLY_COOKIES === 'true',
  },

  security: {
    fieldEncryptionKey: process.env.FIELD_ENCRYPTION_KEY,
  },

  storage: {
    provider: process.env.STORAGE_PROVIDER ?? 'local',
    local: {
      basePath: process.env.STORAGE_LOCAL_PATH ?? './storage/uploads',
    },
    s3: {
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION ?? 'us-east-1',
      bucket: process.env.S3_BUCKET ?? 'portal-rh-documents',
      accessKey: process.env.S3_ACCESS_KEY,
      secretKey: process.env.S3_SECRET_KEY,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      presignedUrlExpirySeconds: parseInt(
        process.env.S3_PRESIGNED_URL_EXPIRY_SECONDS ?? '300',
        10,
      ),
    },
  },

  documents: {
    maxFileSizeBytes: parseInt(process.env.DOCUMENT_MAX_FILE_SIZE_BYTES ?? String(10 * 1024 * 1024), 10),
    allowedMimeTypes: (
      process.env.DOCUMENT_ALLOWED_MIME_TYPES ??
      'application/pdf,image/jpeg,image/png,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ).split(','),
    signedUrlExpirySeconds: parseInt(process.env.S3_PRESIGNED_URL_EXPIRY_SECONDS ?? '300', 10),
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS?.replace(/\s/g, ''),
    fromEmail:
      process.env.SMTP_FROM_EMAIL ??
      process.env.RESEND_FROM_EMAIL ??
      'Portal RH <admin@hrportal.com>',
    enabled: process.env.SMTP_ENABLED !== 'false' && !!process.env.SMTP_HOST,
  },

  resend: {
    apiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.RESEND_FROM_EMAIL ?? 'Portal RH <admin@hrportal.com>',
    enabled: process.env.RESEND_ENABLED !== 'false' && !!process.env.RESEND_API_KEY,
  },

  defaultUserPassword: process.env.DEFAULT_USER_PASSWORD ?? 'Coral@2024',

  integrations: {
    govbr: { enabled: process.env.GOVBR_ENABLED === 'true' },
    whatsapp: { enabled: process.env.WHATSAPP_ENABLED === 'true' },
    payroll: { enabled: process.env.PAYROLL_ENABLED === 'true' },
    activeDirectory: { enabled: process.env.ACTIVE_DIRECTORY_ENABLED === 'true' },
  },
});
