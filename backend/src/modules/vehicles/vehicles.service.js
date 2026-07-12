const db = require("../../config/db");
const AppError = require("../../utils/appError");

const VEHICLE_TYPES = Object.freeze(["truck", "mini_truck", "van", "bike"]);
const VEHICLE_STATUSES = Object.freeze(["available", "on_trip", "maintenance", "out_of_service", "retired"]);
const DEFAULT_PRICE_PER_KM = Object.freeze({
  truck: 65,
  mini_truck: 45,
  van: 30,
  bike: 12,
});

const normalizePlate = (plate) => plate.trim().toUpperCase();

const toVehicle = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  name: row.name,
  type: row.type,
  plate: row.plate,
  capacityKg: Number(row.capacity_kg),
  odometerKm: Number(row.odometer_km),
  status: row.status,
  region: row.region,
  pricePerKm: Number(row.price_per_km),
  retired: row.retired,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

async function listVehicles(organizationId, filters = {}) {
  const conditions = ["organization_id = $1"];
  const values = [organizationId];

  if (filters.includeRetired !== "true") {
    conditions.push("retired = false");
  }

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`status = $${values.length}`);
  }

  if (filters.type) {
    values.push(filters.type);
    conditions.push(`type = $${values.length}`);
  }

  const result = await db.query(
    `SELECT *
     FROM vehicles
     WHERE ${conditions.join(" AND ")}
     ORDER BY created_at DESC`,
    values
  );

  return result.rows.map(toVehicle);
}

async function getVehicle(organizationId, vehicleId) {
  const result = await db.query(
    "SELECT * FROM vehicles WHERE id = $1 AND organization_id = $2",
    [vehicleId, organizationId]
  );

  if (!result.rows[0]) throw new AppError(404, "Vehicle not found");
  return toVehicle(result.rows[0]);
}

async function createVehicle(organizationId, actorUserId, payload) {
  const type = payload.type;
  const pricePerKm = payload.pricePerKm ?? DEFAULT_PRICE_PER_KM[type] ?? 0;

  try {
    const result = await db.query(
      `INSERT INTO vehicles (
         organization_id, name, type, plate, capacity_kg, odometer_km,
         status, region, price_per_km, retired, created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, $10)
       RETURNING *`,
      [
        organizationId,
        payload.name.trim(),
        type,
        normalizePlate(payload.plate),
        Number(payload.capacityKg),
        Number(payload.odometerKm ?? 0),
        payload.status || "available",
        payload.region?.trim() || null,
        Number(pricePerKm),
        actorUserId,
      ]
    );

    return toVehicle(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") throw new AppError(409, "Vehicle plate is already registered");
    throw error;
  }
}

async function updateVehicle(organizationId, vehicleId, payload) {
  const fields = [];
  const values = [];

  const add = (column, value) => {
    values.push(value);
    fields.push(`${column} = $${values.length}`);
  };

  if (payload.name !== undefined) add("name", payload.name.trim());
  if (payload.type !== undefined) add("type", payload.type);
  if (payload.plate !== undefined) add("plate", normalizePlate(payload.plate));
  if (payload.capacityKg !== undefined) add("capacity_kg", Number(payload.capacityKg));
  if (payload.odometerKm !== undefined) add("odometer_km", Number(payload.odometerKm));
  if (payload.status !== undefined) add("status", payload.status);
  if (payload.region !== undefined) add("region", payload.region?.trim() || null);
  if (payload.pricePerKm !== undefined) add("price_per_km", Number(payload.pricePerKm));
  if (payload.retired !== undefined) add("retired", Boolean(payload.retired));

  if (!fields.length) throw new AppError(400, "No update fields provided");

  values.push(vehicleId, organizationId);

  try {
    const result = await db.query(
      `UPDATE vehicles
       SET ${fields.join(", ")}
       WHERE id = $${values.length - 1} AND organization_id = $${values.length}
       RETURNING *`,
      values
    );

    if (!result.rows[0]) throw new AppError(404, "Vehicle not found");
    return toVehicle(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") throw new AppError(409, "Vehicle plate is already registered");
    throw error;
  }
}

async function updateVehicleStatus(organizationId, vehicleId, status) {
  const retired = status === "retired";
  const result = await db.query(
    `UPDATE vehicles
     SET status = $1, retired = $2
     WHERE id = $3 AND organization_id = $4
     RETURNING *`,
    [status, retired, vehicleId, organizationId]
  );

  if (!result.rows[0]) throw new AppError(404, "Vehicle not found");
  return toVehicle(result.rows[0]);
}

async function retireVehicle(organizationId, vehicleId) {
  const current = await getVehicle(organizationId, vehicleId);
  if (current.status === "on_trip") {
    throw new AppError(400, "Vehicle cannot be retired while on trip");
  }

  return updateVehicleStatus(organizationId, vehicleId, "retired");
}

module.exports = {
  VEHICLE_TYPES,
  VEHICLE_STATUSES,
  DEFAULT_PRICE_PER_KM,
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  updateVehicleStatus,
  retireVehicle,
};
