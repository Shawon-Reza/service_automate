import { remote, type Browser } from "webdriverio";
import { getAppiumOptions } from "./appium.config.js";

export class AppiumSessionManager {
  private readonly sessions = new Map<string, Browser>();
  private readonly creating = new Map<string, Promise<Browser>>();

  async createSession(deviceId: string): Promise<Browser> {
    const existing = this.sessions.get(deviceId);
    if (existing) return existing;

    const pending = this.creating.get(deviceId);
    if (pending) return pending;

    const creation = remote(getAppiumOptions(deviceId));
    this.creating.set(deviceId, creation);
    try {
      const browser = await creation;
      this.sessions.set(deviceId, browser);
      return browser;
    } finally {
      this.creating.delete(deviceId);
    }
  }

  getSession(deviceId: string): Browser | undefined {
    return this.sessions.get(deviceId);
  }

  hasSession(deviceId: string): boolean {
    return this.sessions.has(deviceId);
  }

  async deleteSession(deviceId: string): Promise<void> {
    const browser = this.sessions.get(deviceId);
    if (!browser) return;
    this.sessions.delete(deviceId);
    await browser.deleteSession();
  }

  async restartSession(deviceId: string): Promise<Browser> {
    await this.deleteSession(deviceId);
    return this.createSession(deviceId);
  }
}

export const appiumSessionManager = new AppiumSessionManager();
