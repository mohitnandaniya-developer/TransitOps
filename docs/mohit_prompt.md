You are a senior full-stack engineer working on TransitOps, a Smart Transport
Operations Platform.

Your assigned responsibility is:

1. Project architecture
2. PostgreSQL database foundation
3. Authentication
4. Role-Based Access Control
5. Shared backend middleware
6. Shared frontend application shell
7. User and organization management

## Technology Stack

Frontend:
- React with Vite
- React Router
- Axios or Fetch
- Vanilla CSS only

Backend:
- Node.js
- Express.js
- PostgreSQL
- pg package
- bcrypt
- jsonwebtoken
- dotenv
- cors

Do not use:
- Tailwind CSS
- Bootstrap
- Material UI
- Firebase
- MongoDB
- Prisma unless the existing repository already depends on it and replacing it
  would create unnecessary risk

## Repository Instructions

First inspect the complete existing repository.

The repository may already contain a partial legacy implementation. Reuse working
code where appropriate, but update it to match the TransitOps requirements.

Do not trust README claims without verifying the real implementation.

Do not remove working modules belonging to other team members.

Work on branch:

mohit/core-auth-database

## Required Folder Structure

Use or migrate toward this structure:

transitops/
├── frontend/
│   └── src/
│       ├── components/
│       ├── layouts/
│       ├── pages/
│       ├── context/
│       ├── services/
│       ├── utils/
│       └── styles/
└── backend/
    └── src/
        ├── config/
        ├── middleware/
        ├── modules/
        ├── routes/
        ├── utils/
        └── app.js

Database migrations should be stored in:

backend/migrations/

## Roles

Create these roles:

- fleet_manager
- dispatcher
- safety_officer
- financial_analyst

Permission expectations:

### Fleet Manager
- Full fleet access
- Manage users
- Manage vehicles
- Manage drivers
- Manage trips
- Manage maintenance
- View expenses
- View reports

### Dispatcher
- View vehicles and drivers
- Create and manage trips
- Dispatch, complete and cancel trips
- Cannot manage users
- Cannot delete financial records

### Safety Officer
- View drivers
- Manage driver compliance and status
- View license validity
- View maintenance information
- Cannot modify financial information

### Financial Analyst
- View fuel logs and expenses
- View analytics and reports
- Export reports
- Cannot dispatch trips
- Cannot change vehicle or driver operational status

## Database Foundation

Create a migration-based PostgreSQL setup.

Create the following initial tables:

### organizations

Fields:

- id UUID primary key
- name VARCHAR not null
- created_at TIMESTAMP
- updated_at TIMESTAMP

### users

Fields:

- id UUID primary key
- organization_id UUID foreign key
- name VARCHAR not null
- email VARCHAR unique not null
- password_hash VARCHAR not null
- role VARCHAR not null
- is_active BOOLEAN default true
- created_at TIMESTAMP
- updated_at TIMESTAMP

Do not store plain-text passwords.

Add CHECK constraints for supported roles.

Other team members will create their own module migrations, so create a migration
runner that automatically executes pending SQL migration files in order.

Create:

- migrations table
- migration runner script
- database connection pool
- environment validation

## Authentication Requirements

Implement secure authentication using email and password.

Required endpoints:

POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
POST /api/auth/change-password

Login response should return:

- user information
- role
- organization
- JWT access token

JWT must contain only necessary claims:

- userId
- organizationId
- role

Create middleware:

- authenticate
- authorizeRoles
- validateRequest
- errorHandler
- notFoundHandler

Protected routes must require:

Authorization: Bearer <token>

Do not trust custom headers such as:

x-user-role
x-user-email
x-company-id

The server must derive identity and role from the verified JWT.

## Multi-Tenant Data Isolation

All operational data must belong to an organization.

Every protected query must filter by organization_id.

A user from one organization must never access another organization's records.

Create reusable helpers so other team members can safely access:

req.user.id
req.user.organizationId
req.user.role

## Shared Frontend Authentication

Create:

- AuthContext
- useAuth hook
- ProtectedRoute component
- RoleRoute component
- Axios API client with JWT interceptor
- automatic logout for invalid or expired token
- loading state while checking authentication

Store authentication carefully.

Prefer an httpOnly cookie when feasible.

When using localStorage for the hackathon, document the security tradeoff clearly.

## Shared Application Layout

Create the reusable authenticated layout:

- responsive sidebar
- top navigation bar
- current user name
- role label
- logout button
- mobile sidebar toggle
- light and dark mode support
- accessible keyboard navigation

Navigation items should appear based on role permissions.

Pages may initially use placeholders, but create routes for:

- /dashboard
- /vehicles
- /drivers
- /trips
- /maintenance
- /fuel-expenses
- /analytics
- /users

Do not implement the business modules assigned to the other members.

## User Management

Create a fleet-manager-only user management page and APIs.

Required endpoints:

GET /api/users
POST /api/users
PUT /api/users/:id
PATCH /api/users/:id/status
DELETE /api/users/:id

Rules:

- Only fleet_manager can manage users.
- A user cannot delete their own account.
- User email must be unique.
- Password must be hashed.
- Role must be one of the supported roles.
- Disabled users cannot log in.
- All user operations must stay within the same organization.

## Validation and Security

Implement:

- parameterized PostgreSQL queries
- centralized error handling
- password hashing with bcrypt
- secure JWT verification
- helmet if compatible
- reasonable CORS configuration
- request body limits
- login input validation
- email validation
- password minimum length
- generic invalid-login errors
- no password hashes in API responses

## Testing

Add at least these tests or executable verification scripts:

1. Valid login
2. Invalid password
3. Disabled user login
4. Unauthorized protected route
5. Role-blocked route
6. Cross-organization access attempt
7. Duplicate user email
8. Invalid role creation

## Environment Example

Create `.env.example` containing:

PORT=
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=
CLIENT_URL=

Do not commit secrets.

## Integration Contract

Other team members will depend on:

- database migration runner
- authentication middleware
- role middleware
- organization isolation
- API client
- authenticated layout
- role-based frontend navigation

Document these components clearly in:

docs/INTEGRATION_CONTRACT.md

Include:

- how to create migrations
- how to protect an endpoint
- how to restrict roles
- how to access organizationId
- API response format
- error response format

Use this error shape consistently:

{
  "success": false,
  "message": "Readable message",
  "errors": []
}

Use this success shape where practical:

{
  "success": true,
  "data": {},
  "message": "Optional message"
}

## Completion Output

After implementation:

1. Run frontend build.
2. Run backend startup verification.
3. Run authentication tests.
4. Provide a list of changed files.
5. Provide migration instructions.
6. Provide test credentials.
7. Report any remaining integration risks.

Do not claim completion unless the project builds successfully.

# Color Theme
Follow Odoo Theme Color Patter Purple and White Theme
https://www.odoo.com/
