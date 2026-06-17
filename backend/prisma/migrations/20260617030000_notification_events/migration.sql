-- AlterTable
ALTER TABLE "notifications"
ADD COLUMN "type" TEXT NOT NULL DEFAULT 'system.general',
ADD COLUMN "category" TEXT NOT NULL DEFAULT 'system',
ADD COLUMN "messageKey" TEXT NOT NULL DEFAULT 'notifications.system.general',
ADD COLUMN "actorUserId" TEXT,
ADD COLUMN "metadata" JSONB;

-- CreateIndex
CREATE INDEX "notifications_tenantId_userId_category_idx"
ON "notifications"("tenantId", "userId", "category");

-- CreateIndex
CREATE INDEX "notifications_tenantId_userId_type_idx"
ON "notifications"("tenantId", "userId", "type");
