import { Router } from "express";
import { adbService } from "../adb/adb.service.js";
import { appiumSessionManager } from "../appium/appium.session.manager.js";
import { actions } from "../automation-core/actions.js";
import { automationManager } from "../automations/automation.manager.js";
import { deviceManager } from "../devices/device.manager.js";
import { jobManager } from "../jobs/job.manager.js";

export const apiRouter = Router();

apiRouter.get("/devices", async (_req, res, next) => {
  try { res.json({ success: true, data: await deviceManager.getDevices() }); }
  catch (error) { next(error); }
});

apiRouter.get("/devices/:deviceId", async (req, res, next) => {
  try {
    const device = await deviceManager.getDevice(req.params.deviceId);
    if (!device) return res.status(404).json({ success: false, message: "Device not found." });
    return res.json({ success: true, data: device });
  } catch (error) { return next(error); }
});

apiRouter.get("/devices/:deviceId/status", async (req, res, next) => {
  try {
    const device = await deviceManager.getDevice(req.params.deviceId);
    if (!device) return res.status(404).json({ success: false, message: "Device not found." });
    return res.json({ success: true, data: { id: device.id, status: device.status } });
  } catch (error) { return next(error); }
});

apiRouter.post("/devices/:deviceId/session", async (req, res, next) => {
  try {
    const device = await deviceManager.getDevice(req.params.deviceId);
    if (!device || device.status === "OFFLINE" || device.status === "UNAUTHORIZED" || device.status === "ERROR") {
      return res.status(409).json({ success: false, message: "Device is not online and authorized." });
    }
    const driver = await appiumSessionManager.createSession(device.id);
    return res.json({ success: true, data: { deviceId: device.id, sessionId: driver.sessionId } });
  } catch (error) { return next(error); }
});

apiRouter.get("/devices/:deviceId/screenshot", async (req, res, next) => {
  try {
    const base64 = await adbService.takeScreenshot(req.params.deviceId);
    return res.type("png").send(Buffer.from(base64, "base64"));
  } catch (error) { return next(error); }
});

apiRouter.post("/devices/:deviceId/back", async (req, res, next) => {
  try {
    const driver = appiumSessionManager.getSession(req.params.deviceId);
    if (!driver) return res.status(409).json({ success: false, message: "Create an Appium session first." });
    await driver.back();
    return res.json({ success: true });
  } catch (error) { return next(error); }
});

apiRouter.post("/devices/:deviceId/tap", async (req, res, next) => {
  try {
    const driver = appiumSessionManager.getSession(req.params.deviceId);
    if (!driver) return res.status(409).json({ success: false, message: "Create an Appium session first." });

    const { strategy, value } = req.body ?? {};
    if (typeof value !== "string" || !value.trim()) {
      return res.status(400).json({ success: false, message: "A selector value is required." });
    }

    if (strategy === "accessibilityId") await actions.tapByAccessibilityId(driver, value);
    else if (strategy === "resourceId") await actions.tapByResourceId(driver, value);
    else if (strategy === "text") await actions.tapByText(driver, value);
    else return res.status(400).json({ success: false, message: "strategy must be accessibilityId, resourceId, or text." });

    return res.json({ success: true });
  } catch (error) { return next(error); }
});

apiRouter.delete("/devices/:deviceId/session", async (req, res, next) => {
  try {
    await appiumSessionManager.deleteSession(req.params.deviceId);
    return res.json({ success: true, message: "Session closed." });
  } catch (error) { return next(error); }
});

apiRouter.get("/services", (_req, res) => res.json({ success: true, data: automationManager.listServices() }));
apiRouter.get("/services/:serviceId", (req, res) => {
  const service = automationManager.getService(req.params.serviceId);
  if (!service) return res.status(404).json({ success: false, message: "Service not found." });
  return res.json({ success: true, data: service.info });
});

apiRouter.post("/automation/start", async (req, res, next) => {
  try {
    const { serviceId, deviceId, data } = req.body ?? {};
    if (typeof serviceId !== "string" || typeof deviceId !== "string") {
      return res.status(400).json({ success: false, message: "serviceId and deviceId are required." });
    }
    const job = await automationManager.start(serviceId, deviceId, data);
    return res.status(202).json({ success: true, data: job });
  } catch (error) { return next(error); }
});

apiRouter.get("/automation", async (_req, res, next) => {
  try {
    return res.json({ success: true, data: await jobManager.list() });
  } catch (error) { return next(error); }
});

apiRouter.get("/automation/:jobId", async (req, res, next) => {
  try {
    const job = await jobManager.get(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: "Job not found." });
    return res.json({ success: true, data: job });
  } catch (error) { return next(error); }
});

apiRouter.post("/automation/:jobId/stop", async (req, res, next) => {
  try {
    const job = await jobManager.get(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: "Job not found." });
    if (job.status === "PENDING" || job.status === "RUNNING") {
      return res.status(409).json({ success: false, message: "Stopping running Appium commands is not supported yet." });
    }
    return res.json({ success: true, data: job });
  } catch (error) { return next(error); }
});
