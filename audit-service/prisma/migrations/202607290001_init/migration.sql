CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuditEvent_eventId_key" ON "AuditEvent"("eventId");
CREATE INDEX "AuditEvent_entity_idx" ON "AuditEvent"("entity");
CREATE INDEX "AuditEvent_action_idx" ON "AuditEvent"("action");
CREATE INDEX "AuditEvent_userId_idx" ON "AuditEvent"("userId");
CREATE INDEX "AuditEvent_userEmail_idx" ON "AuditEvent"("userEmail");
CREATE INDEX "AuditEvent_timestamp_idx" ON "AuditEvent"("timestamp");
