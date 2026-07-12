const app = require("../src/app");
const db = require("../src/config/db");

async function verifyStartup() {
  await db.query("SELECT 1");
  const routesLoaded = Boolean(app);
  if (!routesLoaded) throw new Error("Express app failed to load");
  console.log("Startup verification passed: environment, database, and app loaded");
}

verifyStartup()
  .catch((error) => {
    console.error("Startup verification failed");
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => db.pool.end());
