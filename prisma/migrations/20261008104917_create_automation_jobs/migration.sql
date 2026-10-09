-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'STOPPED');

-- CreateTable
CREATE TABLE "AutomationJob" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "AutomationJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AutomationJob_createdAt_idx" ON "AutomationJob"("createdAt");

-- CreateIndex
CREATE INDEX "AutomationJob_deviceId_status_idx" ON "AutomationJob"("deviceId", "status");
