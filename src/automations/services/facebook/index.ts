import { createPlaceholderService } from "../shared.js";

export const facebookService = createPlaceholderService({
  id: "facebook",
  name: "Facebook",
  description: "Service-specific automation placeholder.",
  fields: [{ name: "phoneNumbers", label: "Phone numbers (one per line)", type: "textarea", required: true }],
});
