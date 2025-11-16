-- CreateTable
CREATE TABLE "public"."InterfaceConfigSnapshot" (
    "id" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "vdom" TEXT,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "interfaceName" TEXT,

    CONSTRAINT "InterfaceConfigSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RouteConfigSnapshot" (
    "id" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "vdom" TEXT,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "routeSeqNum" INTEGER,

    CONSTRAINT "RouteConfigSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterfaceConfigSnapshot_deviceName_createdAt_idx" ON "public"."InterfaceConfigSnapshot"("deviceName", "createdAt");

-- CreateIndex
CREATE INDEX "RouteConfigSnapshot_deviceName_createdAt_idx" ON "public"."RouteConfigSnapshot"("deviceName", "createdAt");
