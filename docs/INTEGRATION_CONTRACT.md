# TransitOps Integration Contract

This document defines the shared foundation other TransitOps modules should use.

## Backend Structure

Core backend files:

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

Required backend environment:

```env
PORT=5000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/transitops
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
```

Optional:

```env
DB_SSL=false
```

Frontend environment:

```env
VITE_API_URL=http://localhost:5000/api
```

## Roles

Supported roles:

- `fleet_manager`
- `dispatcher`
- `safety_officer`
- `financial_analyst`

Use `backend/src/utils/roles.js` and `frontend/src/utils/roles.js` instead of hard-coding role strings in new code.

## Migrations

Create SQL migration files in:

```text
backend/migrations/
```

Use numeric prefixes so files run in order:

```text
001_core_auth.sql
002_vehicles.sql
003_drivers.sql
```

Run migrations:

```bash
npm run backend:migrate
```

The runner creates a `migrations` table and executes only pending `.sql` files.

Module tables must include an `organization_id UUID NOT NULL REFERENCES organizations(id)` column unless they are globally shared configuration tables.

## Protecting Endpoints

Use JWT authentication:

```js
const authenticate = require("../../middleware/authenticate");

router.get("/vehicles", authenticate, asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  // Always filter queries by organizationId.
}));
```

Available identity values:

```js
req.user.id
req.user.organizationId
req.user.role
req.user.email
req.user.name
```

Do not trust client-provided tenant or role headers. Do not use:

```text
x-user-role
x-user-email
x-company-id
```

## Restricting Roles

Use `authorizeRoles` after `authenticate`:

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

Example:

```js
await db.query(
  "SELECT * FROM vehicles WHERE organization_id = $1 ORDER BY created_at DESC",
  [req.user.organizationId]
);
```

For updates/deletes, include both the record id and organization id:

```js
await db.query(
  "UPDATE vehicles SET status = $1 WHERE id = $2 AND organization_id = $3 RETURNING *",
  [status, req.params.id, req.user.organizationId]
);
```

If no row is returned, respond as `404`. This prevents cross-organization disclosure.

## API Response Format

Use this success shape where practical:

```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

Use this error shape consistently:

```json
{
  "success": false,
  "message": "Readable message",
  "errors": []
}
```

The helper in `backend/src/utils/responses.js` returns success responses.

## Auth API

Implemented endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/change-password`

Register request:

```json
{
  "organizationName": "Acme Logistics",
  "name": "Asha Manager",
  "email": "asha@example.com",
  "password": "StrongPass123"
}
```

Login response data:

```json
{
  "user": {
    "id": "uuid",
    "organizationId": "uuid",
    "name": "Asha Manager",
    "email": "asha@example.com",
    "role": "fleet_manager",
    "isActive": true
  },
  "organization": {
    "id": "uuid",
    "name": "Acme Logistics"
  },
  "token": "jwt"
}
```

JWT claims contain only:

```json
{
  "userId": "uuid",
  "organizationId": "uuid",
  "role": "fleet_manager"
}
```

## User Management API

All `/api/users` endpoints require:

- `Authorization: Bearer <token>`
- `fleet_manager` role

Implemented endpoints:

- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/:id`
- `PATCH /api/users/:id/status`
- `DELETE /api/users/:id`

Rules:

- Only users in the same organization are returned or mutated.
- A user cannot delete their own account.
- Email is unique globally.
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

Use `useAuth()` for current user data:

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

The frontend currently stores the JWT in `localStorage` under:

```text
transitops.accessToken
```

This is acceptable for the hackathon foundation but has XSS exposure risk. A production hardening pass should move access tokens to an httpOnly secure cookie or a short-lived access token plus refresh-token flow.

The Axios interceptor dispatches automatic logout on `401` responses.

## Frontend Navigation

Role-filtered navigation is defined in:

```text
frontend/src/utils/roles.js
```

Add new pages to `NAV_ITEMS` and update `PAGE_PERMISSIONS`.

Business module pages currently have protected placeholder routes:

- `/dashboard`
- `/vehicles`
- `/drivers`
- `/trips`
- `/maintenance`
- `/fuel-expenses`
- `/analytics`
- `/users`

Only `/users` has full feature behavior in this foundation.
