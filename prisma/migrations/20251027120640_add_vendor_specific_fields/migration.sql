-- CreateEnum
CREATE TYPE "public"."DeviceStatus" AS ENUM ('Active', 'Inactive', 'Maintenance', 'Error');

-- AlterTable
ALTER TABLE "public"."Device" ADD COLUMN     "apiKey" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastSync" TIMESTAMP(3),
ADD COLUMN     "model" TEXT,
ADD COLUMN     "status" "public"."DeviceStatus" NOT NULL DEFAULT 'Active',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "vendor" TEXT,
ADD COLUMN     "version" TEXT;

-- AlterTable
ALTER TABLE "public"."Policy" ADD COLUMN     "cliConfig" TEXT,
ADD COLUMN     "rawConfig" JSONB,
ADD COLUMN     "vendor" TEXT,
ADD COLUMN     "vendorId" TEXT;
