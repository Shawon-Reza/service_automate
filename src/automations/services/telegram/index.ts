import { createPlaceholderService } from "../shared.js";

export const telegramService = createPlaceholderService({
  id: "telegram",
  name: "Telegram",
  description: "Service-specific automation placeholder.",
  fields: [{ name: "phoneNumbers", label: "Phone numbers (one per line)", type: "textarea", required: true }],
});
