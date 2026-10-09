import type { AutomationService, ServiceInfo } from "../automation.types.js";

function requireObject(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Automation data must be an object.");
  }
  return data as Record<string, unknown>;
}

function requirePhoneNumbers(data: Record<string, unknown>): string[] {
  const value = data.phoneNumbers;
  const numbers = Array.isArray(value)
    ? value.map(String).map((number) => number.trim()).filter(Boolean)
    : typeof value === "string"
      ? value.split(/\r?\n/).map((number) => number.trim()).filter(Boolean)
      : [];

  if (numbers.length === 0) throw new Error("Enter at least one phone number.");
  return numbers;
}

export function createPlaceholderService(
  info: ServiceInfo,
  options: { needsMessage?: boolean } = {},
): AutomationService {
  const needsMessage = options.needsMessage ?? false;

  return {
    info,
    validateData(data) {
      const input = requireObject(data);
      const phoneNumbers = requirePhoneNumbers(input);
      if (needsMessage && (typeof input.message !== "string" || !input.message.trim())) {
        throw new Error("A message is required.");
      }
      return { ...input, phoneNumbers, ...(needsMessage ? { message: String(input.message).trim() } : {}) };
    },
    async execute() {
      throw new Error(`${info.name} automation is not implemented yet.`);
    },
  };
}
