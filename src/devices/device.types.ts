export type DeviceStatus = "AVAILABLE" | "BUSY" | "OFFLINE" | "UNAUTHORIZED" | "ERROR";

export interface Device {
  id: string;
  model?: string;
  androidVersion?: string;
  status: DeviceStatus;
  currentActivity?: string;
}
