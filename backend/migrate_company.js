/**
 * migrate_company.js
 * One-time migration: adds multi-tenant company support.
 * Run with: node migrate_company.js
 */
const db = require("./db");

async function run() {
    try {
        console.log("Starting company migration...");

        // 1. Create companies table
        await db.query(`
            CREATE TABLE IF NOT EXISTS companies (
                id VARCHAR(20) PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("✅ companies table ready");

        // 2. Seed the demo company
        await db.query(`
            INSERT INTO companies (id, name) VALUES ('demo', 'TransitOps Demo Company')
            ON CONFLICT DO NOTHING;
        `);

        // 3. Add company_id to users
        await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id VARCHAR(20) DEFAULT 'demo';`);
        await db.query(`UPDATE users SET company_id = 'demo' WHERE company_id IS NULL;`);
        console.log("✅ users.company_id added");

        // 4. Delete all non-demo real users
        const deleted = await db.query(`DELETE FROM users WHERE email NOT LIKE '%@transitops.io' RETURNING email;`);
        if (deleted.rows.length > 0) {
            console.log(`🗑️  Removed ${deleted.rows.length} real users: ${deleted.rows.map(r => r.email).join(", ")}`);
        } else {
            console.log("ℹ️  No real users to remove.");
        }

        // 5. Add company_id to all data tables (replacing user_email logic)
        const tables = ["vehicles", "drivers", "trips", "maintenance_logs", "fuel_expenses"];
        for (const t of tables) {
            await db.query(`ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS company_id VARCHAR(20) DEFAULT 'demo';`);
            // Migrate existing data: map user_email='demo' → company_id='demo'
            await db.query(`UPDATE ${t} SET company_id = 'demo' WHERE user_email = 'demo' AND (company_id IS NULL OR company_id = '');`);
            console.log(`✅ ${t}.company_id added`);
        }

        console.log("\n🎉 Migration complete! All tables updated for multi-tenant companies.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    }
}

run();
