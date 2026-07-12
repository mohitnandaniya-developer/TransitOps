# TransitOps

TransitOps is a Smart Transport Operations Platform fleet workflows, rebuilt with a stronger TransitOps foundation.

This first feature delivers:

- PostgreSQL migration runner
- `organizations` and `users` core tables
- JWT authentication
- Role-Based Access Control
- Organization-scoped user management APIs
- React Router frontend shell
- AuthContext, protected routes, role routes, and Axios JWT interceptor
- Fleet-manager-only user management page

## Local Setup

1. Install dependencies:

   ```bash
   npm --prefix backend install
   npm --prefix frontend install
   ```

2. Create backend env:

   ```bash
   cp backend/.env.example backend/.env
   ```

3. Update `backend/.env` with a real `DATABASE_URL` and long `JWT_SECRET`.

4. Run migrations:

   ```bash
   npm run backend:migrate
   ```

5. Start the backend:

   ```bash
   npm run backend:start
   ```

6. Start the frontend:

   ```bash
   npm run frontend:dev
   ```

## First User

Use the frontend "Create Organization" flow or call:

```bash
POST /api/auth/register
```

That creates an organization and first `fleet_manager` user. New users are managed from `/users`.

## Verification

With dependencies installed and PostgreSQL configured:

```bash
npm run backend:verify
npm run backend:test:auth
npm run frontend:build
```

See [docs/INTEGRATION_CONTRACT.md](docs/INTEGRATION_CONTRACT.md) before adding module APIs.
