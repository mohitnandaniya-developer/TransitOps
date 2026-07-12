# TransitOps Vehicle Registry

This feature adds the organization-scoped vehicle inventory module.

## Scope

Implemented:

- Vehicle database migration.
- Vehicle backend module and routes.
- Fleet-manager write access.
- Dispatcher read access.
- Frontend `/vehicles` page.
- Filters by type, status, and search text.
- Create, edit, status update, and retire actions for fleet managers.

Not implemented in this feature:

- Trip assignment.
- Driver assignment.
- Maintenance workflow automation.
- Billing or invoice calculations.

Those modules should integrate with the vehicle table through `organization_id`.

## Migration

Migration file:

```text
backend/migrations/002_vehicles.sql
```

Run:

```bash
npm run backend:migrate
```

## Table

`vehicles`

Important fields:

- `id UUID`
- `organization_id UUID`
- `name`
- `type`
- `plate`
- `capacity_kg`
- `odometer_km`
- `status`
- `region`
- `price_per_km`
- `retired`
- `created_by`
- `created_at`
- `updated_at`

Supported types:

- `truck`
- `mini_truck`
- `van`
- `bike`

Supported statuses:

- `available`
- `on_trip`
- `maintenance`
- `out_of_service`
- `retired`

Default rates:

- `truck`: 65
- `mini_truck`: 45
- `van`: 30
- `bike`: 12

## API

All routes require:

```text
Authorization: Bearer <token>
```

Routes:

- `GET /api/vehicles`
- `GET /api/vehicles/:id`
- `POST /api/vehicles`
- `PUT /api/vehicles/:id`
- `PATCH /api/vehicles/:id/status`
- `DELETE /api/vehicles/:id`

Read roles:

- `fleet_manager`
- `dispatcher`

Write roles:

- `fleet_manager`

## Create Payload

```json
{
  "name": "Transit Truck 01",
  "type": "truck",
  "plate": "GJ-01-AB-1234",
  "capacityKg": 12000,
  "odometerKm": 15000,
  "status": "available",
  "region": "West",
  "pricePerKm": 65
}
```

## Response Shape

```json
{
  "success": true,
  "data": {
    "vehicle": {
      "id": "uuid",
      "organizationId": "uuid",
      "name": "Transit Truck 01",
      "type": "truck",
      "plate": "GJ-01-AB-1234",
      "capacityKg": 12000,
      "odometerKm": 15000,
      "status": "available",
      "region": "West",
      "pricePerKm": 65,
      "retired": false
    }
  },
  "message": "Vehicle created"
}
```

## Isolation Rule

Every query filters by `req.user.organizationId`.

Update and delete operations return `404` when the vehicle does not belong to the caller's organization.

## Frontend

Route:

```text
/vehicles
```

File:

```text
frontend/src/pages/VehicleRegistry.jsx
```

Behavior:

- Fleet managers see the create/edit form and actions.
- Dispatchers see read-only registry data.
- The shared Axios client provides the JWT header.
