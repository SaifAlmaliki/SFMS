-- CreateEnum
CREATE TYPE "public"."TicketType" AS ENUM ('FirewallPolicy', 'ITSupport', 'NetworkAccess', 'Hardware', 'Software', 'Email', 'VPN', 'AdminAccess', 'PasswordReset', 'AccessRequest', 'Other');

-- AlterTable
ALTER TABLE "public"."ChangeTicket" ADD COLUMN     "category" TEXT,
ADD COLUMN     "estimatedResolutionTime" TIMESTAMP(3),
ADD COLUMN     "isNetworkRelated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "keywords" TEXT[],
ADD COLUMN     "ticketType" "public"."TicketType" NOT NULL DEFAULT 'FirewallPolicy';

-- CreateTable
CREATE TABLE "public"."KnowledgeBase" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "ticketType" TEXT NOT NULL,
    "keywords" TEXT[],
    "solution" TEXT,
    "commonPatterns" JSONB,
    "frequency" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditReport" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "format" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditReport_pkey" PRIMARY KEY ("id")
);
