-- CreateEnum
CREATE TYPE "public"."SyncStatus" AS ENUM ('Pending', 'Synced', 'Failed', 'Disabled');

-- AlterTable
ALTER TABLE "public"."ChangeTicket" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "externalSystem" TEXT,
ADD COLUMN     "externalUrl" TEXT,
ADD COLUMN     "lastSyncAt" TIMESTAMP(3),
ADD COLUMN     "syncStatus" "public"."SyncStatus" NOT NULL DEFAULT 'Pending';

-- CreateTable
CREATE TABLE "public"."ExternalTicketSystem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalTicketSystem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExternalTicketSystem_name_key" ON "public"."ExternalTicketSystem"("name");
