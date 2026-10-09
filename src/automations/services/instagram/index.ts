import { createPlaceholderService } from "../shared.js";

export const instagramService = createPlaceholderService({
  id: "instagram",
  name: "Instagram",
  description: "Service-specific automation placeholder.",
  fields: [{ name: "phoneNumbers", label: "Phone numbers (one per line)", type: "textarea", required: true }],
});
