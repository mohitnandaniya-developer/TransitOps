const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../../config/db");
const env = require("../../config/env");
const AppError = require("../../utils/appError");
const { ROLES } = require("../../utils/roles");

const normalizeEmail = (email) => email.trim().toLowerCase();

const userSelect = `
  u.id,
  u.organization_id,
  u.name,
  u.email,
  u.role,
  u.is_active,
  u.created_at,
  u.updated_at,
  o.name AS organization_name
`;

const toPublicUser = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  name: row.name,
  email: row.email,
  role: row.role,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toOrganization = (row) => ({
  id: row.organization_id,
  name: row.organization_name,
});

const signToken = (user) => jwt.sign(
  {
    userId: user.id,
    organizationId: user.organization_id,
    role: user.role,
  },
  env.jwtSecret,
  { expiresIn: env.jwtExpiresIn }
);

async function register({ organizationName, name, email, password }) {
  const normalizedEmail = normalizeEmail(email);

  return db.withTransaction(async (client) => {
    const existing = await client.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (existing.rows.length) {
      throw new AppError(409, "Email is already registered");
    }

    const organizationResult = await client.query(
      "INSERT INTO organizations (name) VALUES ($1) RETURNING id, name",
      [organizationName.trim()]
    );
    const organization = organizationResult.rows[0];
    const passwordHash = await bcrypt.hash(password, 12);

    const userResult = await client.query(
      `INSERT INTO users (organization_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, organization_id, name, email, role, is_active, created_at, updated_at`,
      [organization.id, name.trim(), normalizedEmail, passwordHash, ROLES.FLEET_MANAGER]
    );

    const row = {
      ...userResult.rows[0],
      organization_name: organization.name,
    };

    return {
      user: toPublicUser(row),
      organization: toOrganization(row),
      token: signToken(row),
    };
  });
}

async function login({ email, password }) {
  const normalizedEmail = normalizeEmail(email);

  const result = await db.query(
    `SELECT ${userSelect}, u.password_hash
     FROM users u
     JOIN organizations o ON o.id = u.organization_id
     WHERE u.email = $1`,
    [normalizedEmail]
  );

  const user = result.rows[0];
  const invalid = new AppError(401, "Invalid email or password");

  if (!user || !user.is_active) throw invalid;

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw invalid;

  return {
    user: toPublicUser(user),
    organization: toOrganization(user),
    token: signToken(user),
  };
}

async function getCurrentUser(userId, organizationId) {
  const result = await db.query(
    `SELECT ${userSelect}
     FROM users u
     JOIN organizations o ON o.id = u.organization_id
     WHERE u.id = $1 AND u.organization_id = $2`,
    [userId, organizationId]
  );

  const user = result.rows[0];
  if (!user) throw new AppError(404, "User not found");

  return {
    user: toPublicUser(user),
    organization: toOrganization(user),
  };
}

async function changePassword(userId, organizationId, currentPassword, newPassword) {
  const result = await db.query(
    "SELECT id, password_hash FROM users WHERE id = $1 AND organization_id = $2",
    [userId, organizationId]
  );

  const user = result.rows[0];
  if (!user) throw new AppError(404, "User not found");

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw new AppError(400, "Current password is incorrect");

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.query(
    "UPDATE users SET password_hash = $1 WHERE id = $2 AND organization_id = $3",
    [passwordHash, userId, organizationId]
  );

  return true;
}

module.exports = {
  register,
  login,
  getCurrentUser,
  changePassword,
  toPublicUser,
};
