import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { env } from "../config/env.js";
import type { AdbDevice, AdbState } from "./adb.types.js";

const execFileAsync = promisify(execFile);

export class AdbService {
  async run(args: string[], timeout = 10_000): Promise<string> {
    try {
      const result = await execFileAsync(env.adbPath, args, { timeout, windowsHide: true });
      return result.stdout.trim();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown ADB error";
      if (message.includes("ENOENT")) {
        throw new Error(`ADB was not found. Install Android Platform Tools or set ADB_PATH. (${message})`, { cause: error });
      }
      throw new Error(`ADB command failed: ${message}`, { cause: error });
    }
  }

  async getConnectedDevices(): Promise<AdbDevice[]> {
    const output = await this.run(["devices"]);
    return output
      .split(/\r?\n/)
      .slice(1)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [id, rawState] = line.split(/\s+/);
        const state: AdbState = rawState === "device" || rawState === "offline" || rawState === "unauthorized"
          ? rawState
          : "unknown";
        return { id, state };
      });
  }

  async getAndroidVersion(deviceId: string): Promise<string | undefined> {
    return this.getProperty(deviceId, "ro.build.version.release");
  }

  async getDeviceModel(deviceId: string): Promise<string | undefined> {
    return this.getProperty(deviceId, "ro.product.model");
  }

  async getCurrentActivity(deviceId: string): Promise<string | undefined> {
    const output = await this.run(["-s", deviceId, "shell", "dumpsys", "activity", "activities"]);
    return output.match(/mResumedActivity:\s+[^\s]+\s+([^\s]+)/)?.[1];
  }

  async takeScreenshot(deviceId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      execFile(
        env.adbPath,
        ["-s", deviceId, "exec-out", "screencap", "-p"],
        { timeout: 20_000, maxBuffer: 20 * 1024 * 1024, windowsHide: true, encoding: null },
        (error, stdout) => {
          if (error) {
            reject(new Error(`Could not capture a screenshot: ${error.message}`));
            return;
          }
          resolve((stdout as Buffer).toString("base64"));
        },
      );
    });
  }

  async executeShellCommand(deviceId: string, args: string[]): Promise<string> {
    return this.run(["-s", deviceId, "shell", ...args]);
  }

  private async getProperty(deviceId: string, property: string): Promise<string | undefined> {
    const value = await this.run(["-s", deviceId, "shell", "getprop", property]);
    return value || undefined;
  }
}

export const adbService = new AdbService();
