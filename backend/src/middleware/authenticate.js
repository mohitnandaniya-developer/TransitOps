const jwt = require("jsonwebtoken");
const db = require("../config/db");
const env = require("../config/env");
const AppError = require("../utils/appError");

const authenticate = async (req, _res, next) => {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new AppError(401, "Authentication required");
    }

    const payload = jwt.verify(token, env.jwtSecret);

    const result = await db.query(
      `SELECT
         u.id,
         u.organization_id,
         u.name,
         u.email,
         u.role,
         u.is_active,
         o.name AS organization_name
       FROM users u
       JOIN organizations o ON o.id = u.organization_id
       WHERE u.id = $1 AND u.organization_id = $2`,
      [payload.userId, payload.organizationId]
    );

    const user = result.rows[0];
    if (!user || !user.is_active) {
      throw new AppError(401, "Authentication required");
    }

    req.user = {
      id: user.id,
      organizationId: user.organization_id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: {
        id: user.organization_id,
        name: user.organization_name,
      },
    };

    return next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    return next(new AppError(401, "Authentication required"));
  }
};

module.exports = authenticate;
