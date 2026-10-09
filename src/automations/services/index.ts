import type { AutomationService } from "../automation.types.js";
import { facebookService } from "./facebook/index.js";
import { instagramService } from "./instagram/index.js";
import { telegramService } from "./telegram/index.js";
import { whatsappService } from "./whatsapp/index.js";

export const automationServices: AutomationService[] = [
  facebookService,
  whatsappService,
  instagramService,
  telegramService,
];
