export type AdbState = "device" | "offline" | "unauthorized" | "unknown";

export interface AdbDevice {
  id: string;
  state: AdbState;
}
