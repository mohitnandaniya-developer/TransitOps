const fs = require("fs");
const path = require("path");
const db = require("../src/config/db");

const migrationsDir = path.join(__dirname, "..", "migrations");

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(client) {
  const result = await client.query("SELECT filename FROM migrations ORDER BY filename ASC");
  return new Set(result.rows.map((row) => row.filename));
}

async function runMigrations() {
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  await db.withTransaction(async (client) => {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);

    for (const file of files) {
      if (applied.has(file)) continue;

      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      console.log(`Running migration ${file}`);
      await client.query(sql);
      await client.query("INSERT INTO migrations (filename) VALUES ($1)", [file]);
    }
  });

  console.log("Migrations complete");
}

if (require.main === module) {
  runMigrations()
    .catch((error) => {
      console.error("Migration failed");
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => db.pool.end());
}

module.exports = {
  runMigrations,
};
