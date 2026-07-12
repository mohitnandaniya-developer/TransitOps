# TransitOps Integration Contract

This document defines the shared foundation other TransitOps modules should use.

## Backend Structure

- `backend/src/app.js` creates the Express app.
- `backend/src/server.js` starts the API server.
- `backend/src/config/env.js` validates required environment values.
- `backend/src/config/db.js` exports the PostgreSQL pool, `query`, and `withTransaction`.
- `backend/scripts/migrate.js` runs SQL migrations in order.
- `backend/src/middleware/authenticate.js` verifies JWTs.
- `backend/src/middleware/authorizeRoles.js` restricts roles.
- `backend/src/middleware/validateRequest.js` validates request inputs.
- `backend/src/middleware/errorHandler.js` normalizes errors.
- `backend/src/middleware/notFoundHandler.js` handles unknown routes.

## Environment

Required backend values:

```env
PORT=5000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/transitops
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
```

Frontend value:

```env
VITE_API_URL=http://localhost:5000/api
```

## Roles

Use `backend/src/utils/roles.js` and `frontend/src/utils/roles.js`.

Supported roles:

- `fleet_manager`
- `dispatcher`
- `safety_officer`
- `financial_analyst`

## Migrations

Add SQL files to `backend/migrations/` with numeric prefixes:

```text
001_core_auth.sql
002_vehicles.sql
003_drivers.sql
```

Run:

```bash
npm run backend:migrate
```

The migration runner creates a `migrations` table and executes only pending SQL files.

Module-owned tables must include `organization_id UUID NOT NULL REFERENCES organizations(id)` unless they are truly global configuration tables.

## Protecting Endpoints

```js
const authenticate = require("../../middleware/authenticate");

router.get("/vehicles", authenticate, asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
}));
```

Available identity:

```js
req.user.id
req.user.organizationId
req.user.role
req.user.email
req.user.name
```

Never trust `x-user-role`, `x-user-email`, or `x-company-id`.

## Restricting Roles

```js
const authorizeRoles = require("../../middleware/authorizeRoles");
const { ROLES } = require("../../utils/roles");

router.post(
  "/vehicles",
  authenticate,
  authorizeRoles(ROLES.FLEET_MANAGER),
  asyncHandler(async (req, res) => {
    // manager-only action
  })
);
```

## Organization Isolation

Every protected query must filter by `req.user.organizationId`.

```js
await db.query(
  "SELECT * FROM vehicles WHERE organization_id = $1 ORDER BY created_at DESC",
  [req.user.organizationId]
);
```

For updates and deletes, filter by record id and organization id:

```js
await db.query(
  "UPDATE vehicles SET status = $1 WHERE id = $2 AND organization_id = $3 RETURNING *",
  [status, req.params.id, req.user.organizationId]
);
```

Return `404` when no row is returned.

## API Response Format

Success:

```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

Error:

```json
{
  "success": false,
  "message": "Readable message",
  "errors": []
}
```

## Auth API

Implemented endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/change-password`

Register creates an organization and first `fleet_manager`.

JWT claims contain only:

```json
{
  "userId": "uuid",
  "organizationId": "uuid",
  "role": "fleet_manager"
}
```

## User Management API

All `/api/users` endpoints require `Authorization: Bearer <token>` and `fleet_manager`.

Implemented endpoints:

- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/:id`
- `PATCH /api/users/:id/status`
- `DELETE /api/users/:id`

Rules:

- Same-organization access only.
- A user cannot delete their own account.
- Email is unique.
- Passwords are hashed with bcrypt.
- Disabled users cannot log in.
- Password hashes are never returned.

## Frontend Contract

Core frontend files:

- `frontend/src/context/AuthContext.jsx`
- `frontend/src/services/api.js`
- `frontend/src/components/ProtectedRoute.jsx`
- `frontend/src/components/RoleRoute.jsx`
- `frontend/src/layouts/AppLayout.jsx`
- `frontend/src/utils/roles.js`

Use `useAuth()`:

```js
const { user, organization, logout } = useAuth();
```

Use the shared Axios client:

```js
import api from "../services/api";

const response = await api.get("/vehicles");
```

The API client attaches `Authorization: Bearer <token>` automatically.

## Frontend Auth Storage

The frontend stores the JWT in `localStorage` under:

```text
transitops.accessToken
```

This is acceptable for the hackathon foundation but has XSS exposure risk. A production hardening pass should move access tokens to an httpOnly secure cookie or a short-lived access token plus refresh-token flow.

The Axios interceptor dispatches automatic logout on `401` responses.

## Frontend Navigation

Role-filtered navigation is defined in `frontend/src/utils/roles.js`.

Protected routes:

- `/dashboard`
- `/vehicles`
- `/drivers`
- `/trips`
- `/maintenance`
- `/fuel-expenses`
- `/analytics`
- `/users`

Implemented module pages:

- `/users`: full user management for `fleet_manager`.
- `/vehicles`: vehicle registry with manager writes and dispatcher reads.

## Vehicle Registry API

Vehicle routes are implemented under:

```text
/api/vehicles
```

Read access:

- `fleet_manager`
- `dispatcher`

Write access:

- `fleet_manager`

Routes:

- `GET /api/vehicles`
- `GET /api/vehicles/:id`
- `POST /api/vehicles`
- `PUT /api/vehicles/:id`
- `PATCH /api/vehicles/:id/status`
- `DELETE /api/vehicles/:id`

See `docs/VEHICLE_REGISTRY.md` for payloads and table details.
