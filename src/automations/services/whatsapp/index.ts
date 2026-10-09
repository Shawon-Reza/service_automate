import { createPlaceholderService } from "../shared.js";

export const whatsappService = createPlaceholderService({
  id: "whatsapp",
  name: "WhatsApp",
  description: "Service-specific automation placeholder.",
  fields: [
    { name: "phoneNumbers", label: "Phone numbers (one per line)", type: "textarea", required: true },
    { name: "message", label: "Message", type: "textarea", required: true },
  ],
}, { needsMessage: true });
