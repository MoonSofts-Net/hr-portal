-- Portal RH — example RLS policies (NOT applied automatically)
-- Run manually or copy into a Prisma migration after baseline schema is deployed.

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- CREATE POLICY users_tenant_isolation ON users
--   FOR ALL
--   USING (
--     current_setting('app.is_super_admin', true) = 'true'
--     OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
--   )
--   WITH CHECK (
--     current_setting('app.is_super_admin', true) = 'true'
--     OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
--   );

-- Repeat for: employee_profiles, user_roles, onboarding_*, documents,
-- hr_requests, hr_request_messages, notifications, point_*, audit_logs,
-- system_settings (tenant scope), refresh_tokens.

-- document_versions (join-based):
-- CREATE POLICY document_versions_tenant ON document_versions
--   FOR ALL
--   USING (
--     current_setting('app.is_super_admin', true) = 'true'
--     OR EXISTS (
--       SELECT 1 FROM documents d
--       WHERE d.id = document_versions.document_id
--         AND d.tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
--     )
--   );
