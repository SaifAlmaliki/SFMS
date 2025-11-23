-- CreateEnum
CREATE TYPE "public"."EvaluationRunStatus" AS ENUM ('Pending', 'Running', 'Success', 'Failed');

-- CreateEnum
CREATE TYPE "public"."EventSeverity" AS ENUM ('Info', 'Low', 'Medium', 'High', 'Critical');

-- CreateEnum
CREATE TYPE "public"."SnapshotType" AS ENUM ('ConfigGlobal', 'ConfigPolicy', 'Routing', 'UserDirectory', 'Certificates', 'Other');

-- CreateEnum
CREATE TYPE "public"."IngestionJobType" AS ENUM ('TrafficLog', 'ThreatLog', 'SystemEvent', 'ConfigSnapshot', 'UserActivity', 'Alert');

-- CreateEnum
CREATE TYPE "public"."IngestionStatus" AS ENUM ('Pending', 'Running', 'Success', 'Failed');

-- CreateTable
CREATE TABLE "public"."ComplianceFrameworkStatus" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "status" "public"."ComplianceStatus" NOT NULL,
    "coverage" INTEGER NOT NULL,
    "lastAudit" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ComplianceFrameworkStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ComplianceControlResult" (
    "id" TEXT NOT NULL,
    "controlRecordId" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "status" "public"."ComplianceControlStatus" NOT NULL,
    "score" INTEGER,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evidenceRefs" JSONB,
    "details" TEXT,
    "evaluationRunId" TEXT,

    CONSTRAINT "ComplianceControlResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ComplianceEvaluationRun" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "public"."EvaluationRunStatus" NOT NULL,
    "triggeredBy" TEXT,
    "controlsEvaluated" INTEGER NOT NULL DEFAULT 0,
    "frameworksUpdated" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "notes" TEXT,

    CONSTRAINT "ComplianceEvaluationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FirewallEvent" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT,
    "sourceEndpoint" TEXT NOT NULL,
    "severity" "public"."EventSeverity" NOT NULL,
    "eventTime" TIMESTAMP(3) NOT NULL,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,
    "hash" TEXT NOT NULL,

    CONSTRAINT "FirewallEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FirewallSnapshot" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT,
    "snapshotType" "public"."SnapshotType" NOT NULL,
    "version" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,
    "diffFromPrev" JSONB,

    CONSTRAINT "FirewallSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IngestionRun" (
    "id" TEXT NOT NULL,
    "jobType" "public"."IngestionJobType" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "public"."IngestionStatus" NOT NULL,
    "itemsFetched" INTEGER NOT NULL DEFAULT 0,
    "lastCursor" TEXT,
    "error" TEXT,
    "deviceId" TEXT,

    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceFrameworkStatus_frameworkId_key" ON "public"."ComplianceFrameworkStatus"("frameworkId");

-- CreateIndex
CREATE INDEX "ComplianceControlResult_frameworkId_idx" ON "public"."ComplianceControlResult"("frameworkId");

-- CreateIndex
CREATE INDEX "ComplianceControlResult_controlRecordId_evaluatedAt_idx" ON "public"."ComplianceControlResult"("controlRecordId", "evaluatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FirewallEvent_hash_key" ON "public"."FirewallEvent"("hash");

-- CreateIndex
CREATE INDEX "FirewallEvent_deviceId_eventTime_idx" ON "public"."FirewallEvent"("deviceId", "eventTime");

-- CreateIndex
CREATE INDEX "FirewallEvent_sourceEndpoint_eventTime_idx" ON "public"."FirewallEvent"("sourceEndpoint", "eventTime");

-- CreateIndex
CREATE INDEX "FirewallSnapshot_deviceId_snapshotType_capturedAt_idx" ON "public"."FirewallSnapshot"("deviceId", "snapshotType", "capturedAt");

-- AddForeignKey
ALTER TABLE "public"."ComplianceFrameworkStatus" ADD CONSTRAINT "ComplianceFrameworkStatus_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "public"."ComplianceFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplianceControlResult" ADD CONSTRAINT "ComplianceControlResult_controlRecordId_fkey" FOREIGN KEY ("controlRecordId") REFERENCES "public"."ComplianceControl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplianceControlResult" ADD CONSTRAINT "ComplianceControlResult_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "public"."ComplianceFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplianceControlResult" ADD CONSTRAINT "ComplianceControlResult_evaluationRunId_fkey" FOREIGN KEY ("evaluationRunId") REFERENCES "public"."ComplianceEvaluationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FirewallEvent" ADD CONSTRAINT "FirewallEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "public"."Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FirewallSnapshot" ADD CONSTRAINT "FirewallSnapshot_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "public"."Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IngestionRun" ADD CONSTRAINT "IngestionRun_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "public"."Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;
