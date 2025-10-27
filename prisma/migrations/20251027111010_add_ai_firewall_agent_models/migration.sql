-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('Viewer', 'Editor', 'Admin');

-- CreateEnum
CREATE TYPE "public"."MessageRole" AS ENUM ('User', 'Assistant');

-- CreateEnum
CREATE TYPE "public"."TicketStatus" AS ENUM ('Draft', 'PendingApproval', 'Approved', 'Rejected', 'Scheduled', 'Deployed', 'Failed');

-- CreateEnum
CREATE TYPE "public"."TicketPriority" AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- CreateEnum
CREATE TYPE "public"."LogAction" AS ENUM ('Allow', 'Deny', 'Drop');

-- CreateEnum
CREATE TYPE "public"."LogSeverity" AS ENUM ('Info', 'Warning', 'Critical');

-- CreateEnum
CREATE TYPE "public"."AlertType" AS ENUM ('AnomalyDetected', 'PolicyViolation', 'ThresholdExceeded', 'ConfigurationDrift', 'FailedDeployment');

-- CreateEnum
CREATE TYPE "public"."AlertSeverity" AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- CreateEnum
CREATE TYPE "public"."AlertStatus" AS ENUM ('Open', 'Acknowledged', 'Resolved', 'Suppressed');

-- CreateEnum
CREATE TYPE "public"."DeploymentStatus" AS ENUM ('Pending', 'InProgress', 'Success', 'Failed', 'RolledBack');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "public"."MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChangeTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "policyId" TEXT,
    "requestedBy" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "public"."TicketStatus" NOT NULL,
    "priority" "public"."TicketPriority" NOT NULL,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "deployedAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),

    CONSTRAINT "ChangeTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TicketComment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FirewallLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceIp" TEXT NOT NULL,
    "destIp" TEXT NOT NULL,
    "sourcePort" INTEGER,
    "destPort" INTEGER,
    "protocol" TEXT NOT NULL,
    "action" "public"."LogAction" NOT NULL,
    "policyId" TEXT,
    "deviceName" TEXT NOT NULL,
    "severity" "public"."LogSeverity" NOT NULL,
    "message" TEXT,

    CONSTRAINT "FirewallLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Alert" (
    "id" TEXT NOT NULL,
    "type" "public"."AlertType" NOT NULL,
    "severity" "public"."AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" "public"."AlertStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PolicyDeployment" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "ticketId" TEXT,
    "deployedBy" TEXT NOT NULL,
    "deployedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."DeploymentStatus" NOT NULL,
    "targetDevice" TEXT NOT NULL,
    "errorMessage" TEXT,
    "rollbackId" TEXT,

    CONSTRAINT "PolicyDeployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeTicket_ticketNumber_key" ON "public"."ChangeTicket"("ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeTicket_policyId_key" ON "public"."ChangeTicket"("policyId");

-- AddForeignKey
ALTER TABLE "public"."ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChangeTicket" ADD CONSTRAINT "ChangeTicket_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "public"."Policy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TicketComment" ADD CONSTRAINT "TicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."ChangeTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PolicyDeployment" ADD CONSTRAINT "PolicyDeployment_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "public"."Policy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
