-- AlterTable
ALTER TABLE "public"."Policy" ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "businessJustification" TEXT,
ADD COLUMN     "destPort" INTEGER,
ADD COLUMN     "destinationZone" TEXT,
ADD COLUMN     "requestedBy" TEXT,
ADD COLUMN     "sourceZone" TEXT,
ADD COLUMN     "targetDevice" TEXT;

-- CreateTable
CREATE TABLE "public"."PolicyHistory" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,
    "previousStatus" TEXT,
    "newStatus" TEXT,

    CONSTRAINT "PolicyHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."PolicyHistory" ADD CONSTRAINT "PolicyHistory_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "public"."Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
