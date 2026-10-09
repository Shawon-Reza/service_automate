import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { apiRouter } from "./routes/api.routes.js";

export const app = express();

app.use(cors({ origin: env.frontendOrigin }));
app.use(express.json({ limit: "1mb" }));
app.get("/api/health", (_req, res) => res.json({ success: true, status: "healthy" }));
app.use("/api", apiRouter);

app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found." }));
app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const message = error instanceof Error ? error.message : "Unexpected server error.";
  const status = message.startsWith("Unknown service:") || message.startsWith("Device ") && message.endsWith(" was not found.") ? 404
    : message.includes("currently busy") || message.includes("not available") ? 409
      : message.includes("required") || message.includes("Enter at least") || message.includes("must be") ? 400
        : typeof error === "object" && error !== null && "status" in error && typeof error.status === "number" && error.status >= 400 && error.status < 500 ? error.status
          : 503;
  res.status(status).json({ success: false, message });
});
