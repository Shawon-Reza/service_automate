import "dotenv/config";

function readPort(value: string | undefined, fallback: number): number {
  const port = Number(value ?? fallback);
  return Number.isInteger(port) && port > 0 ? port : fallback;
}

export const env = {
  port: readPort(process.env.PORT, 5000),
  adbPath: process.env.ADB_PATH || "adb",
  appiumHost: process.env.APPIUM_HOST || "127.0.0.1",
  appiumPort: readPort(process.env.APPIUM_PORT, 4723),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
};
