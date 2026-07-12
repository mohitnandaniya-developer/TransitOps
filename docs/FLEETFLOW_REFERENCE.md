# FleetFlow Reference Notes For TransitOps

Source repository: https://github.com/mihirrgajjar/FleetFlow
Inspection date: 2026-07-12

Important rule from user: do not clone FleetFlow. Use GitHub/file reads as reference and copy/adapt code only when creating TransitOps.

## What FleetFlow Is

FleetFlow is a fleet/logistics operations app for Indian transport workflows. It combines a React/Vite frontend with an Express/PostgreSQL backend. The main business modules are:

- Dashboard
- Vehicle registry
- Driver profiles
- Trip dispatcher
- Route tracking
- Maintenance logs
- Fuel/toll/other expenses
- Analytics/reports
- Company registration/recovery
- Auth, password reset, and email billing

## Current FleetFlow Stack

Frontend:

- React with Vite
- Axios API client
- Hash-based page routing inside `App.jsx`, not React Router in the inspected code
- `react-icons`
- `jspdf` and `jspdf-autotable` for invoice PDFs
- Custom vanilla CSS in `frontend/src/styles/global.css` and `modal.css`

Backend:

- Node.js + Express
- PostgreSQL via `pg`
- bcrypt
- dotenv, cors, compression
- Brevo email SDK (`sib-api-v3-sdk`) in the inspected `email.js`

README drift:

- README says React 18, React Router, Recharts, Nodemailer, MIT license, and demo password `demo123`.
- Actual inspected code uses React 19 dependencies, hash routing, custom SVG charts, Brevo SDK, no root `LICENSE` file available through direct fetch, and `initDb.js` seeds `fleet123`.

## Backend Shape

Entry:

- `backend/server.js`
- Applies compression, CORS, JSON/body limits, `/api/ping`, `/api/health`, and mounts routes at `/api`.
- Ensures performance indexes on startup.

Database:

- `backend/db.js` creates a PostgreSQL pool.
- Supports `DATABASE_URL` with SSL or local `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`.

Schema from `backend/initDb.js`:

- `users`
- `vehicles`
- `drivers`
- `trips`
- `maintenance_logs`
- `fuel_expenses`
- `password_resets`

Important TransitOps improvement:

- FleetFlow's inspected schema is not migration-based and does not use UUID organizations/users.
- It stores seeded demo passwords in plaintext.
- It has `company_id` fields on operational tables but no robust migration-based multi-tenant foundation in the inspected schema.
- TransitOps must use migrations, UUID `organizations`, UUID `users`, hashed passwords, JWT auth, and organization-scoped queries.

## Backend API Behavior

Auth and tenant identity:

- FleetFlow trusts custom headers:
  - `x-company-id`
  - `x-user-email`
  - `x-user-role`
- `getCompanyId(req)` falls back to `demo`.
- `getUserRole(req)` reads role from headers.

Important TransitOps improvement:

- Do not copy this auth model.
- TransitOps must derive `userId`, `organizationId`, and `role` from verified JWT claims.
- Protected APIs should use `Authorization: Bearer <token>`.

Companies:

- `POST /api/companies`: creates `CO-XXXXXX`.
- `GET /api/companies/:id`: validates company ID.
- `POST /api/companies/recover`: exact case-insensitive lookup by name.

Vehicles:

- `GET /api/vehicles`
- `POST /api/vehicles`
- `PUT /api/vehicles/:id`
- `DELETE /api/vehicles/:id`
- Default per-km prices:
  - Truck: 65
  - Mini-truck: 45
  - Van: 30
  - Bike: 12
- Manager-only pricing updates and deletes.
- Vehicle status changes if active trips exist.

Drivers:

- `GET /api/drivers`
- `POST /api/drivers`
- `PUT /api/drivers/:id`
- `DELETE /api/drivers/:id`
- Manager-only deletes.
- Tracks license/category/expiry/status/trips/safety score/phone.

Trips:

- `GET /api/trips`
- `POST /api/trips`
- `PUT /api/trips/:id`
- `DELETE /api/trips/:id`
- `POST /api/trips/:id/email-bill`
- Dispatch sets vehicle to `on-trip` and driver to `on-duty`.
- Completion/cancel sets vehicle and driver back to available.
- Completion updates vehicle odometer using only `totalKM`; `extraKM` is billing/tracking metadata.
- Cost completion is manager-only in the backend.

Maintenance:

- `GET /api/maintenance`
- `POST /api/maintenance`
- `PUT /api/maintenance/:id`
- `DELETE /api/maintenance/:id`
- New non-completed maintenance marks vehicle out of service/in shop.
- Completion marks vehicle available.

Expenses:

- `GET /api/expenses`
- `POST /api/expenses`
- `DELETE /api/expenses/:id`
- Supports fuel, toll, and other expenses.
- Manager-only deletes.

Route intelligence:

- `POST /api/route/generate`
- `GET /api/route/tracking/:tripId`
- `GET /api/route/cities`
- Uses a static India city/highway/distance dataset.
- Finds direct highway route, connecting hub route, or direct fallback.
- Produces summary, checkpoints with ETA, and live status.

Email:

- `backend/email.js`
- Uses Brevo API key from `BREVO_API_KEY`.
- Env values include `SENDER_EMAIL` and optional `SENDER_NAME`.
- Sends OTP, welcome, password-change, and invoice emails.
- Invoice PDF is generated in the frontend, base64 encoded, and attached by the backend.

## Frontend Shape

App root:

- `frontend/src/App.jsx`
- Stores logged-in user in React state only.
- Uses URL hash to choose the current page.
- Sets Axios default custom headers after login.
- Theme stored in `localStorage` as `fleetflow-theme`.
- Pings backend every 9 minutes to reduce Railway cold starts.

FleetFlow roles in code:

- Manager
- Dispatcher
- Safety
- Analyst

TransitOps roles required by local prompt:

- `fleet_manager`
- `dispatcher`
- `safety_officer`
- `financial_analyst`

Recommended role mapping:

- Manager -> fleet_manager
- Dispatcher -> dispatcher
- Safety -> safety_officer
- Analyst -> financial_analyst

Pages/components inspected:

- `Pages/Home.jsx`
- `Pages/LoginPage.jsx`
- `Pages/Dashboard.jsx`
- `Pages/VehicleRegistry.jsx`
- `Pages/DriverProfiles.jsx`
- `Pages/TripDispatcher.jsx`
- `Pages/MaintenanceLogs.jsx`
- `Pages/FuelExpenses.jsx`
- `Pages/Analytics.jsx`
- `Components/RouteTracker.jsx`
- `api.js`
- `styles/global.css`

## Frontend Product Behavior To Reuse

Dashboard:

- Sidebar exported from `Dashboard.jsx`.
- Role-based navigation.
- Role-specific KPI cards.
- Fetches vehicles, drivers, trips, expenses, and maintenance in parallel.
- Builds alerts and activity from live data.

Vehicle Registry:

- CRUD UI for name/type/plate/capacity/odometer/region/status/price per km.
- Defaults price by vehicle type.
- Manager can edit pricing and delete.

Driver Profiles:

- CRUD UI for driver name/phone/license/category/expiry/status.
- Validates phone and future license expiry.
- Computes license validity and expiring-soon counters.
- Optimistic status updates.

Trip Dispatcher:

- Creates dispatched trips with vehicle, driver, cargo, locations, optional KM, and base cost.
- Validates available vehicle and driver.
- Validates cargo against vehicle capacity.
- Blocks expired-license drivers in UI.
- Completes trips with final KM, toll, other cost, base cost, total cost.
- Generates client-side PDF invoices.
- Sends bill email by posting PDF base64 to backend.
- Expands trip rows to show route tracking.

Route Tracker:

- Calls `/route/generate`.
- Shows highway route, total duration, average speed, current checkpoint, next checkpoint, ETA, progress bar, and checkpoint list.
- Has refresh button.

Maintenance:

- Logs preventive/reactive/scheduled service.
- Requires vehicle, type, title, description, cost, technician.
- Warns that logging service moves vehicle to in-shop.

Fuel/Expenses:

- Logs fuel/toll/other expenses.
- Fuel cost auto-calculates from liters * price per liter.

Analytics:

- Period filters: 1M, 3M, 6M, 1Y.
- Aggregates trip cost, operational cost, completed trips, total KM, completion rate.
- Custom SVG charts.
- CSV exports for full analytics, trips, fuel, payroll, vehicle health, and compliance.

Home/Login:

- Polished marketing/home page with animated counters and truck imagery.
- Login supports role selection, register with company ID, create/recover company ID, and forgot password.

## Design Notes

Visual identity:

- Dark-first theme with light mode.
- Primary accent is orange (`#f97316` / similar).
- Supporting colors: green success, red danger, yellow warning, muted blue-gray text.
- Inter font via Google Fonts.
- Dense operational dashboard layout after login.
- Many inline styles inside page components; global CSS carries shell/card/table/modal classes.

TransitOps should preserve the operational feel but rename/refresh branding:

- FleetFlow -> TransitOps
- FleetFlow demo/company labels -> TransitOps labels
- `fleetflow-theme` localStorage key -> `transitops-theme`
- orange accent can remain if desired, but avoid copying brand text blindly.

## Files Worth Copying/Adapting Later

Backend:

- `routeIntelligence.js` can be adapted almost directly if route intelligence is in scope.
- Business route logic from `routes.js` is useful as behavior reference, but should be split into modules/routes/controllers and protected by JWT middleware.
- `email.js` can inspire templates, but TransitOps env/contracts should decide Brevo vs SMTP.
- `server.js` health/ping/index ideas are useful, but TransitOps should use `src/app.js` and config/middleware structure.

Frontend:

- `global.css` and `modal.css` can seed the visual system, with branding and structure cleaned up.
- `Dashboard.jsx` sidebar/navigation pattern can become a shared layout.
- Page modules can be adapted into lowercase folders/components per TransitOps required structure.
- `TripDispatcher.jsx`, `RouteTracker.jsx`, and `Analytics.jsx` contain the richest business behavior.

## Do Not Carry Over Blindly

- Header-based auth and tenant identity.
- Plaintext seeded passwords.
- Non-migration schema setup.
- README claims that conflict with real code.
- Global duplicated SVG icon definitions across pages.
- Long monolithic route file.
- In-memory-only frontend auth without a clear token lifecycle.
- Direct organization/company access based only on client-provided values.
- Mismatch between vehicle status strings (`in-shop`, `out-of-service`, etc.) without a defined enum.

## TransitOps Build Implications

Based on `mohit_prompt.md`, the core-auth/database foundation should be built first:

- `backend/src/config`
- `backend/src/middleware`
- `backend/src/modules`
- `backend/src/routes`
- `backend/src/utils`
- `backend/src/app.js`
- `backend/migrations`
- `frontend/src/components`
- `frontend/src/layouts`
- `frontend/src/pages`
- `frontend/src/context`
- `frontend/src/services`
- `frontend/src/utils`
- `frontend/src/styles`

First foundation modules should include:

- PostgreSQL pool and env validation
- SQL migration runner and `migrations` table
- `organizations` and `users` migrations
- bcrypt password hashing
- JWT login/register/me/change-password
- `authenticate`, `authorizeRoles`, `validateRequest`, `errorHandler`, `notFoundHandler`
- AuthContext/useAuth
- ProtectedRoute/RoleRoute
- Axios client with JWT interceptor
- Authenticated layout with role-filtered navigation
- Fleet-manager-only user management
- `docs/INTEGRATION_CONTRACT.md`

## Open Caveats

- Direct GitHub tree listing was not available in this session, so notes are based on directly fetched known files and README structure.
- `backend/add_customer_name.js` from README returned 404.
- Root `LICENSE` returned 404, despite README claiming MIT.
- Some files may exist that were not inspected because the tree was unavailable.
