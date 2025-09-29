-- CreateEnum
CREATE TYPE "public"."ComplianceStatus" AS ENUM ('Compliant', 'Needs Review', 'Non-Compliant');

-- CreateEnum
CREATE TYPE "public"."ComplianceControlStatus" AS ENUM ('Compliant', 'Needs Review', 'Non-Compliant');

-- CreateTable
CREATE TABLE "public"."ComplianceFramework" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "public"."ComplianceStatus" NOT NULL,
    "lastAudit" TIMESTAMP(3) NOT NULL,
    "coverage" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceFramework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ComplianceControl" (
    "id" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "public"."ComplianceControlStatus" NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ActivityLog" (
    "id" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceFramework_name_key" ON "public"."ComplianceFramework"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceControl_controlId_frameworkId_key" ON "public"."ComplianceControl"("controlId", "frameworkId");

-- AddForeignKey
ALTER TABLE "public"."ComplianceControl" ADD CONSTRAINT "ComplianceControl_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "public"."ComplianceFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE;
