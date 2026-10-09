import { deviceManager } from "../src/devices/device.manager.js";

try {
  const devices = await deviceManager.getDevices();
  if (devices.length === 0) {
    console.log("No Android devices found. Connect a phone and accept its USB debugging prompt.");
  } else {
    console.table(devices);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Could not check Android devices.");
  process.exitCode = 1;
}
