import { randomUUID } from "node:crypto";
import type { AutomationJob } from "../automations/automation.types.js";
import { prisma } from "../lib/prisma.js";

export class JobManager {
  create(serviceId: string, deviceId: string): Promise<AutomationJob> {
    return prisma.automationJob.create({
      data: {
        id: `job_${randomUUID()}`,
        serviceId,
        deviceId,
      },
    });
  }

  get(jobId: string): Promise<AutomationJob | null> {
    return prisma.automationJob.findUnique({ where: { id: jobId } });
  }

  list(limit = 20): Promise<AutomationJob[]> {
    return prisma.automationJob.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async update(
    jobId: string,
    changes: Partial<Pick<AutomationJob, "status" | "progress" | "startedAt" | "completedAt" | "error">>,
  ): Promise<AutomationJob> {
    return prisma.automationJob.update({
      where: { id: jobId },
      data: changes,
    });
  }

  async failInterruptedJobs(): Promise<void> {
    await prisma.automationJob.updateMany({
      where: { status: { in: ["PENDING", "RUNNING"] } },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        error: "Backend restarted while the job was running.",
      },
    });
  }
}

export const jobManager = new JobManager();
