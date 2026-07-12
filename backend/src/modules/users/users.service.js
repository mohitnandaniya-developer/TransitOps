const bcrypt = require("bcrypt");
const db = require("../../config/db");
const AppError = require("../../utils/appError");
const { hasRole } = require("../../utils/roles");

const normalizeEmail = (email) => email.trim().toLowerCase();

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

async function listUsers(organizationId) {
  const result = await db.query(
    `SELECT id, organization_id, name, email, role, is_active, created_at, updated_at
     FROM users
     WHERE organization_id = $1
     ORDER BY created_at ASC`,
    [organizationId]
  );
  return result.rows.map(toPublicUser);
}

async function createUser(organizationId, payload) {
  const role = payload.role;
  if (!hasRole(role)) throw new AppError(400, "Role is not supported");

  const email = normalizeEmail(payload.email);
  const passwordHash = await bcrypt.hash(payload.password, 12);

  try {
    const result = await db.query(
      `INSERT INTO users (organization_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, organization_id, name, email, role, is_active, created_at, updated_at`,
      [organizationId, payload.name.trim(), email, passwordHash, role]
    );

    return toPublicUser(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") throw new AppError(409, "Email is already registered");
    throw error;
  }
}

async function updateUser(organizationId, userId, payload) {
  const fields = [];
  const values = [];

  const add = (sql, value) => {
    values.push(value);
    fields.push(`${sql} = $${values.length}`);
  };

  if (payload.name !== undefined) add("name", payload.name.trim());
  if (payload.email !== undefined) add("email", normalizeEmail(payload.email));
  if (payload.role !== undefined) {
    if (!hasRole(payload.role)) throw new AppError(400, "Role is not supported");
    add("role", payload.role);
  }
  if (payload.password !== undefined) add("password_hash", await bcrypt.hash(payload.password, 12));

  if (!fields.length) throw new AppError(400, "No update fields provided");

  values.push(userId, organizationId);

  try {
    const result = await db.query(
      `UPDATE users
       SET ${fields.join(", ")}
       WHERE id = $${values.length - 1} AND organization_id = $${values.length}
       RETURNING id, organization_id, name, email, role, is_active, created_at, updated_at`,
      values
    );

    if (!result.rows[0]) throw new AppError(404, "User not found");
    return toPublicUser(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") throw new AppError(409, "Email is already registered");
    throw error;
  }
}

async function setUserStatus(organizationId, userId, isActive) {
  const result = await db.query(
    `UPDATE users
     SET is_active = $1
     WHERE id = $2 AND organization_id = $3
     RETURNING id, organization_id, name, email, role, is_active, created_at, updated_at`,
    [isActive, userId, organizationId]
  );

  if (!result.rows[0]) throw new AppError(404, "User not found");
  return toPublicUser(result.rows[0]);
}

async function deleteUser(organizationId, userId, actorUserId) {
  if (userId === actorUserId) throw new AppError(400, "You cannot delete your own account");

  const result = await db.query(
    "DELETE FROM users WHERE id = $1 AND organization_id = $2 RETURNING id",
    [userId, organizationId]
  );

  if (!result.rows[0]) throw new AppError(404, "User not found");
  return true;
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  setUserStatus,
  deleteUser,
};
