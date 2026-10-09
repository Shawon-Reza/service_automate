import { appiumSessionManager } from "../appium/appium.session.manager.js";
import { deviceManager } from "../devices/device.manager.js";
import type { Device } from "../devices/device.types.js";
import { jobManager } from "../jobs/job.manager.js";
import { automationServices } from "./services/index.js";
import type { AutomationJob } from "./automation.types.js";

export class AutomationManager {
  listServices() {
    return automationServices.map((service) => service.info);
  }

  getService(serviceId: string) {
    return automationServices.find((service) => service.info.id === serviceId);
  }

  async start(serviceId: string, deviceId: string, data: unknown) {
    const service = this.getService(serviceId);
    if (!service) throw new Error(`Unknown service: ${serviceId}`);
    const validatedData = service.validateData(data);
    const device = await deviceManager.getDevice(deviceId);
    if (!device) throw new Error(`Device ${deviceId} was not found.`);
    if (device.status === "UNAUTHORIZED") throw new Error(`Device ${deviceId} is unauthorized. Accept the USB debugging prompt.`);
    if (device.status === "OFFLINE") throw new Error(`Device ${deviceId} is offline.`);
    if (device.status !== "AVAILABLE") throw new Error(`Device ${deviceId} is not available.`);

    deviceManager.reserve(deviceId);
    let job: AutomationJob;
    try {
      job = await jobManager.create(serviceId, deviceId);
    } catch (error) {
      deviceManager.release(deviceId);
      throw error;
    }
    void this.runJob(job.id, service, device, validatedData);
    return job;
  }

  private async runJob(
    jobId: string,
    service: (typeof automationServices)[number],
    device: Device,
    data: Record<string, unknown>,
  ): Promise<void> {
    try {
      await jobManager.update(jobId, { status: "RUNNING", progress: 10, startedAt: new Date() });
      const driver = await appiumSessionManager.createSession(device.id);
      await jobManager.update(jobId, { progress: 50 });
      await service.execute(device, driver, data);
      await jobManager.update(jobId, { status: "COMPLETED", progress: 100, completedAt: new Date() });
    } catch (error) {
      try {
        await jobManager.update(jobId, {
          status: "FAILED",
          completedAt: new Date(),
          error: error instanceof Error ? error.message : "Automation failed.",
        });
      } catch (persistenceError) {
        console.error(`Could not persist failure for automation job ${jobId}.`, persistenceError);
      }
    } finally {
      deviceManager.release(device.id);
    }
  }
}

export const automationManager = new AutomationManager();
