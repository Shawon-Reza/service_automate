import type { Browser } from "webdriverio";
import type { Device } from "../devices/device.types.js";
import type { JobStatus } from "../generated/prisma/client.js";

export type FieldType = "textarea" | "text";

export interface ServiceField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
}

export interface ServiceInfo {
  id: string;
  name: string;
  description: string;
  fields: ServiceField[];
}

export interface AutomationService {
  info: ServiceInfo;
  validateData(data: unknown): Record<string, unknown>;
  execute(device: Device, driver: Browser, data: Record<string, unknown>): Promise<void>;
}

export interface AutomationJob {
  id: string;
  serviceId: string;
  deviceId: string;
  status: JobStatus;
  progress: number;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  error: string | null;
}
