const { Pool } = require("pg");
const env = require("./env");

const baseConfig = {
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: env.dbSsl ? { rejectUnauthorized: false } : false,
};

const hasDiscreteDbConfig = Boolean(env.dbUser && env.dbHost && env.dbName);

const pool = new Pool(
  hasDiscreteDbConfig
    ? {
      ...baseConfig,
      user: env.dbUser,
      host: env.dbHost,
      database: env.dbName,
      password: env.dbPassword,
      port: env.dbPort,
    }
    : {
      ...baseConfig,
      connectionString: env.databaseUrl,
    }
);

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error", error);
});

const query = (text, params) => pool.query(text, params);

const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  withTransaction,
};
