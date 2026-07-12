const AppError = require("../utils/appError");

const validateRequest = (schema) => (req, _res, next) => {
  const errors = [];

  if (schema.body) errors.push(...schema.body(req.body || {}));
  if (schema.params) errors.push(...schema.params(req.params || {}));
  if (schema.query) errors.push(...schema.query(req.query || {}));

  if (errors.length) {
    return next(new AppError(400, "Validation failed", errors));
  }

  return next();
};

module.exports = validateRequest;
