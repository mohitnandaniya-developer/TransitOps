const db = require('./db');

async function fixSync() {
  try {
    // Set vehicles to 'available' if they are 'on-trip' but have no 'dispatched' trip
    const vRes = await db.query(`
      UPDATE vehicles
      SET status = 'available'
      WHERE status = 'on-trip'
        AND id NOT IN (
          SELECT vehicleId FROM trips WHERE status = 'dispatched' AND vehicleId IS NOT NULL
        )
      RETURNING id, name;
    `);
    console.log(`Fixed ${vRes.rowCount} vehicles.`);

    // Set drivers to 'available' if they are 'on-duty' but have no 'dispatched' trip
    const dRes = await db.query(`
      UPDATE drivers
      SET status = 'available'
      WHERE status = 'on-duty'
        AND id NOT IN (
          SELECT driverId FROM trips WHERE status = 'dispatched' AND driverId IS NOT NULL
        )
      RETURNING id, name;
    `);
    console.log(`Fixed ${dRes.rowCount} drivers.`);

  } catch (err) {
    console.error("Error repairing sync:", err);
  } finally {
    process.exit(0);
  }
}

fixSync();
