import { adbService } from "../adb/adb.service.js";
import type { Device } from "./device.types.js";

export class DeviceManager {
  private readonly reservedDevices = new Set<string>();

  async getDevices(): Promise<Device[]> {
    const adbDevices = await adbService.getConnectedDevices();
    return Promise.all(adbDevices.map(async (adbDevice) => {
      const online = adbDevice.state === "device";
      const [model, androidVersion, currentActivity] = online
        ? await Promise.all([
            adbService.getDeviceModel(adbDevice.id).catch(() => undefined),
            adbService.getAndroidVersion(adbDevice.id).catch(() => undefined),
            adbService.getCurrentActivity(adbDevice.id).catch(() => undefined),
          ])
        : [];

      let status: Device["status"] = "ERROR";
      if (adbDevice.state === "offline") status = "OFFLINE";
      else if (adbDevice.state === "unauthorized") status = "UNAUTHORIZED";
      else if (online) status = this.reservedDevices.has(adbDevice.id) ? "BUSY" : "AVAILABLE";

      return { id: adbDevice.id, model, androidVersion, currentActivity, status };
    }));
  }

  async getDevice(deviceId: string): Promise<Device | undefined> {
    return (await this.getDevices()).find((device) => device.id === deviceId);
  }

  reserve(deviceId: string): void {
    if (this.reservedDevices.has(deviceId)) {
      throw new Error(`Device ${deviceId} is currently busy.`);
    }
    this.reservedDevices.add(deviceId);
  }

  release(deviceId: string): void {
    this.reservedDevices.delete(deviceId);
  }

  isReserved(deviceId: string): boolean {
    return this.reservedDevices.has(deviceId);
  }
}

export const deviceManager = new DeviceManager();
