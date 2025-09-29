-- CreateEnum
CREATE TYPE "public"."PolicyAction" AS ENUM ('Allow', 'Deny');

-- CreateEnum
CREATE TYPE "public"."PolicyStatus" AS ENUM ('Active', 'Inactive', 'Pending Approval');

-- CreateEnum
CREATE TYPE "public"."SnapshotStatus" AS ENUM ('Live', 'Archived');

-- CreateEnum
CREATE TYPE "public"."AddressObjectType" AS ENUM ('IP/Range', 'FQDN', 'Geography');

-- CreateEnum
CREATE TYPE "public"."ServiceProtocol" AS ENUM ('TCP', 'UDP', 'ICMP');

-- CreateEnum
CREATE TYPE "public"."ObjectGroupType" AS ENUM ('Address', 'Service');

-- CreateEnum
CREATE TYPE "public"."PolicyTemplateCategory" AS ENUM ('Security', 'Compliance', 'Operations');

-- CreateTable
CREATE TABLE "public"."Policy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "action" "public"."PolicyAction" NOT NULL,
    "status" "public"."PolicyStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Snapshot" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "public"."SnapshotStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Device" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ip" TEXT NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AddressObject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."AddressObjectType" NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "AddressObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServiceObject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "protocol" "public"."ServiceProtocol" NOT NULL,
    "portRange" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "ServiceObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ObjectGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."ObjectGroupType" NOT NULL,
    "members" TEXT[],
    "description" TEXT NOT NULL,

    CONSTRAINT "ObjectGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PolicyTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "public"."PolicyTemplateCategory" NOT NULL,
    "policy" JSONB NOT NULL,

    CONSTRAINT "PolicyTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Snapshot_version_key" ON "public"."Snapshot"("version");

-- CreateIndex
CREATE UNIQUE INDEX "Device_name_key" ON "public"."Device"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Device_ip_key" ON "public"."Device"("ip");
