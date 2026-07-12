const dotenv = require("dotenv");

dotenv.config();

const toBoolean = (value) => ["1", "true", "yes", "on"].includes(String(value).toLowerCase());

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL,
  dbUser: process.env.DB_USER,
  dbHost: process.env.DB_HOST,
  dbName: process.env.DB_NAME,
  dbPassword: process.env.DB_PASSWORD,
  dbPort: Number(process.env.DB_PORT || 5432),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  dbSsl: toBoolean(process.env.DB_SSL),
};

const errors = [];
const hasDiscreteDbConfig = Boolean(env.dbUser && env.dbHost && env.dbName);

if (!env.databaseUrl && !hasDiscreteDbConfig) {
  errors.push("DATABASE_URL is required unless DB_USER, DB_HOST, and DB_NAME are provided");
}
if (hasDiscreteDbConfig && (!Number.isInteger(env.dbPort) || env.dbPort <= 0)) {
  errors.push("DB_PORT must be a positive integer");
}
if (!env.jwtSecret) errors.push("JWT_SECRET is required");
if (env.jwtSecret && env.jwtSecret.length < 24) errors.push("JWT_SECRET must be at least 24 characters");
if (!Number.isInteger(env.port) || env.port <= 0) errors.push("PORT must be a positive integer");

if (env.nodeEnv === "production" && env.jwtSecret === "replace-with-a-long-random-secret") {
  errors.push("JWT_SECRET must be changed in production");
}

if (errors.length) {
  const message = `Invalid environment configuration:\n- ${errors.join("\n- ")}`;
  throw new Error(message);
}

module.exports = env;
