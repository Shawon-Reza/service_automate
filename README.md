# Android Automation Studio

A Windows-first local starter for discovering Android phones with ADB, connecting to each phone with its own Appium/WebdriverIO session, and managing service-based automation jobs.

The project is split into small modules. Each automation service has its own folder so its form, validation, and device workflow can be customized independently. Device IDs come from ADB at runtime. PostgreSQL stores automation job history; device reservations and Appium sessions remain in memory. There is no single-device setting, external queue, or cloud service.

## Architecture

```text
React dashboard
      | HTTP
Express API
      |
Automation manager ---- PostgreSQL job history
      |
Device manager -------- ADB discovery and per-device reservation
      |
Appium session manager - Map<UDID, WebdriverIO Browser>
      |
Android phone(s) over USB
```

The `src/adb`, `src/devices`, `src/appium`, `src/automations`, and `src/jobs` folders each own one responsibility. Each automation lives in `src/automations/services/<service-id>/index.ts`; the `src/automations/services/index.ts` file only registers the available services. Shared placeholder validation is in `src/automations/services/shared.ts`.

Facebook, WhatsApp, Instagram, and Telegram are **placeholders**. Their fields, validation, jobs, device assignment, and Appium session setup are wired, but real service-specific actions have not been implemented. The forms demonstrate data flow only.

## Requirements

- Windows 10/11
- Node.js 20 or newer
- pnpm
- Android SDK Platform Tools (ADB)
- Appium 2 and its UiAutomator2 driver
- Android phone with Developer Options and USB debugging enabled

## Install and configure

From PowerShell in the project directory:

```powershell
pnpm install
Copy-Item .env.example .env
```

If `adb` is not on `PATH`, set `ADB_PATH` in `.env` to the full path, for example `C:\Android\platform-tools\adb.exe`. Do not put device IDs in `.env`; the app discovers all attached devices dynamically.

Set `DATABASE_URL` in `.env` to the PostgreSQL connection string. Create the job-history table once with `pnpm prisma migrate dev --name create_automation_jobs` before starting the backend.

## Prepare Android and Appium

1. Enable **Developer options** and **USB debugging** on the phone.
2. Connect the phone by USB and accept the debugging authorization prompt.
3. Check ADB from PowerShell:

   ```powershell
   adb devices
   pnpm check-devices
   ```

   An authorized phone appears with state `device`. `unauthorized` means the phone still needs approval.
4. Install Appium and UiAutomator2:

   ```powershell
   npm install --global appium
   appium driver install uiautomator2
   appium driver doctor uiautomator2
   ```

5. Start Appium in its own terminal and keep it running:

   ```powershell
   appium --address 127.0.0.1 --port 4723
   ```

## Start the app

Use two PowerShell terminals:

```powershell
# Terminal 1: API
pnpm dev
```

```powershell
# Terminal 2: React dashboard
pnpm frontend
```

Open <http://localhost:5173>. The API listens on <http://localhost:5000> by default and binds to loopback only, so device-control endpoints are not exposed to other machines on the network. Configure `PORT`, `APPIUM_HOST`, `APPIUM_PORT`, and `FRONTEND_ORIGIN` in `.env` when needed.

## Dashboard workflow

1. The dashboard polls `GET /api/devices` and shows ADB UDID, model, Android version, status, and current activity when available.
2. Select **Connect Appium** on a phone to create that device's session. A second phone gets its own session.
3. Select a service and enter the fields shown for that service.
4. Select an available phone and start a job. The job and its status are saved in PostgreSQL and can be read from the dashboard or API.
5. Use the camera button to open an ADB screenshot. `POST /api/devices/:deviceId/back` performs a basic Appium action.

Job history is stored in PostgreSQL. Device reservations and Appium sessions exist only in memory and reset on backend restart. Jobs left pending or running at restart are marked failed. One device can run one job at a time; different devices can run concurrently. Job stop is not implemented. Placeholder jobs fail with a clear message until a service's `execute` method is written.

Set `DATABASE_URL` in `.env` to your PostgreSQL connection string, then create the job-history table by running `pnpm prisma migrate dev --name create_automation_jobs`. Start the API with `pnpm dev`; it connects to PostgreSQL and saves new jobs and status updates. On restart, unfinished jobs are marked failed so they are not left showing as running.

Prisma Studio is available for browsing the PostgreSQL database. Run `pnpm prisma studio` (or `pnpm db:studio`) and open the URL it prints. Run `pnpm db:generate` after changing the Prisma schema; `pnpm build` generates the Prisma Client before compiling the backend.

## REST API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | API health |
| `GET` | `/api/devices` | Discover ADB devices |
| `GET` | `/api/devices/:deviceId` | Device information |
| `GET` | `/api/devices/:deviceId/status` | Device status |
| `POST` | `/api/devices/:deviceId/session` | Create/reuse a device Appium session |
| `GET` | `/api/devices/:deviceId/screenshot` | Return a PNG screenshot |
| `POST` | `/api/devices/:deviceId/back` | Press Android back through Appium |
| `POST` | `/api/devices/:deviceId/tap` | Tap an element using a supported selector |
| `DELETE` | `/api/devices/:deviceId/session` | Close that device session |
| `GET` | `/api/services` | Service metadata and form fields |
| `GET` | `/api/services/:serviceId` | One service definition |
| `POST` | `/api/automation/start` | Validate and start a job |
| `GET` | `/api/automation` | List the 20 most recent jobs |
| `GET` | `/api/automation/:jobId` | Read job state |
| `POST` | `/api/automation/:jobId/stop` | Stop endpoint (unsupported for active jobs) |

Example request:

```json
{
  "serviceId": "whatsapp",
  "deviceId": "DEVICE_UDID_FROM_ADB",
  "data": {
    "phoneNumbers": ["+15550100001"],
    "message": "Example message"
  }
}
```

The tap endpoint expects a session, plus a selector strategy and value:

```json
{
  "strategy": "accessibilityId",
  "value": "Continue"
}
```

Supported strategies are `accessibilityId`, `resourceId`, and `text`.

## Add a service

To customize a service, edit only its folder, for example `src/automations/services/whatsapp/index.ts`. Each service exports an `AutomationService` with:

- `info`: the ID, display name, description, and frontend form fields.
- `validateData(data)`: checks and normalizes that service's submitted values.
- `execute(device, driver, data)`: runs its Appium actions on the selected device.

Use the shared actions from `src/automation-core/actions.ts` where useful. To add a new service, create `src/automations/services/<service-id>/index.ts` and add its export to `src/automations/services/index.ts`. Facebook, WhatsApp, Instagram, and Telegram remain placeholders until their `execute` implementations are customized.

## Multiple devices and parallel jobs

Connect additional phones, authorize each one, then run `adb devices` and `pnpm check-devices`. Each row uses its ADB UDID. The session manager stores one WebdriverIO browser per UDID; reservations prevent two jobs using the same device. Jobs on different devices do not share a driver or lock.

## Current scope

Implemented: ADB device discovery and information, per-device reservations and Appium sessions, basic back action, screenshots, service metadata and validation, REST routes, dynamic forms, PostgreSQL-backed job history, and Prisma Studio.

Not implemented: real service workflows, job cancellation, authentication, Redis, or remote device hosts.
