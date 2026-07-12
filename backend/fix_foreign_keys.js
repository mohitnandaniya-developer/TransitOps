const db = require("./db");

async function fixForeignKeys() {
    try {
        console.log("🔧 Fixing foreign key constraints...\n");

        // Drop existing foreign key constraints
        console.log("Dropping existing foreign key constraints...");
        
        try {
            await db.query(`ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_driverid_fkey`);
            console.log("✓ Dropped trips_driverid_fkey");
        } catch (e) {
            console.log("  (trips_driverid_fkey not found or already dropped)");
        }

        try {
            await db.query(`ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_vehicleid_fkey`);
            console.log("✓ Dropped trips_vehicleid_fkey");
        } catch (e) {
            console.log("  (trips_vehicleid_fkey not found or already dropped)");
        }

        try {
            await db.query(`ALTER TABLE maintenance_logs DROP CONSTRAINT IF EXISTS maintenance_logs_vehicleid_fkey`);
            console.log("✓ Dropped maintenance_logs_vehicleid_fkey");
        } catch (e) {
            console.log("  (maintenance_logs_vehicleid_fkey not found or already dropped)");
        }

        try {
            await db.query(`ALTER TABLE fuel_expenses DROP CONSTRAINT IF EXISTS fuel_expenses_vehicleid_fkey`);
            console.log("✓ Dropped fuel_expenses_vehicleid_fkey");
        } catch (e) {
            console.log("  (fuel_expenses_vehicleid_fkey not found or already dropped)");
        }

        console.log("\nAdding new foreign key constraints with ON DELETE CASCADE...");

        // Add back with ON DELETE CASCADE
        await db.query(`
            ALTER TABLE trips 
            ADD CONSTRAINT trips_driverid_fkey 
            FOREIGN KEY (driverId) REFERENCES drivers(id) ON DELETE CASCADE
        `);
        console.log("✓ Added trips_driverid_fkey with ON DELETE CASCADE");

        await db.query(`
            ALTER TABLE trips 
            ADD CONSTRAINT trips_vehicleid_fkey 
            FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE
        `);
        console.log("✓ Added trips_vehicleid_fkey with ON DELETE CASCADE");

        await db.query(`
            ALTER TABLE maintenance_logs 
            ADD CONSTRAINT maintenance_logs_vehicleid_fkey 
            FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE
        `);
        console.log("✓ Added maintenance_logs_vehicleid_fkey with ON DELETE CASCADE");

        await db.query(`
            ALTER TABLE fuel_expenses 
            ADD CONSTRAINT fuel_expenses_vehicleid_fkey 
            FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE
        `);
        console.log("✓ Added fuel_expenses_vehicleid_fkey with ON DELETE CASCADE");

        console.log("\n✅ Foreign key constraints fixed successfully!");
        console.log("   Drivers and vehicles can now be deleted (related records will cascade delete)");

    } catch (e) {
        console.error("❌ Error fixing foreign keys:", e.message);
    } finally {
        process.exit();
    }
}

fixForeignKeys();
