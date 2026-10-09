import { env } from "../config/env.js";

export function getAppiumOptions(
  deviceId: string,
): Parameters<typeof import("webdriverio").remote>[0] {
  return {
    hostname: env.appiumHost,
    port: env.appiumPort,
    path: "/",
    logLevel: "warn",
    capabilities: {
      platformName: "Android",
      "appium:automationName": "UiAutomator2",
      "appium:udid": deviceId,
      "appium:noReset": true,
      "appium:ignoreHiddenApiPolicyError": true,
      "appium:newCommandTimeout": 300,
    },
  };
}
