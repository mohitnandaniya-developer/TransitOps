const db = require("./db");

async function migrate() {
    try {
        // ── Original migration: user_email on all tables ────────────────
        const tables = ['vehicles', 'drivers', 'trips', 'maintenance_logs', 'fuel_expenses'];
        for (const table of tables) {
            await db.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS user_email VARCHAR(100) DEFAULT 'demo'`);
            console.log(`user_email column on ${table} — OK`);
        }

        // ── Feature: vehicle pricing ─────────────────────────────────────
        await db.query(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS price_per_km NUMERIC DEFAULT 0`);
        console.log("price_per_km column on vehicles — OK");

        // Set default prices based on existing vehicle types
        await db.query(`UPDATE vehicles SET price_per_km = 65  WHERE LOWER(type) = 'truck'      AND price_per_km = 0`);
        await db.query(`UPDATE vehicles SET price_per_km = 45  WHERE LOWER(type) = 'mini-truck' AND price_per_km = 0`);
        await db.query(`UPDATE vehicles SET price_per_km = 30  WHERE LOWER(type) IN ('van','Van') AND price_per_km = 0`);
        await db.query(`UPDATE vehicles SET price_per_km = 12  WHERE LOWER(type) = 'bike'       AND price_per_km = 0`);
        console.log("Default pricing applied to existing vehicles — OK");

        // ── Feature: trip cost fields ────────────────────────────────────
        await db.query(`ALTER TABLE trips ADD COLUMN IF NOT EXISTS totalKM    NUMERIC`);
        await db.query(`ALTER TABLE trips ADD COLUMN IF NOT EXISTS extraKM    NUMERIC DEFAULT 0`);
        await db.query(`ALTER TABLE trips ADD COLUMN IF NOT EXISTS baseCost   NUMERIC`);
        await db.query(`ALTER TABLE trips ADD COLUMN IF NOT EXISTS tollCost   NUMERIC DEFAULT 0`);
        await db.query(`ALTER TABLE trips ADD COLUMN IF NOT EXISTS otherCost  NUMERIC DEFAULT 0`);
        await db.query(`ALTER TABLE trips ADD COLUMN IF NOT EXISTS totalCost  NUMERIC`);
        console.log("Cost columns on trips — OK");

        // ── Feature: multi-tenancy support (company_id) ──────────────────
        const multiTenantTables = ['vehicles', 'drivers', 'trips', 'maintenance_logs', 'fuel_expenses'];
        for (const table of multiTenantTables) {
            await db.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS company_id VARCHAR(50) DEFAULT 'demo'`);
            console.log(`company_id column on ${table} — OK`);
        }

        console.log("\n✅ Migration complete.");
    } catch (e) {
        console.error("Migration error:", e);
    } finally {
        process.exit();
    }
}

migrate();
