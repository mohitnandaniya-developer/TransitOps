const { hasRole } = require("./roles");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

const requiredString = (body, field, label = field) => {
  if (!isNonEmptyString(body[field])) return `${label} is required`;
  return null;
};

const emailError = (body, field = "email") => {
  if (!isNonEmptyString(body[field])) return "Email is required";
  if (!EMAIL_REGEX.test(body[field].trim())) return "Email must be valid";
  return null;
};

const passwordError = (body, field = "password", label = "Password") => {
  if (!isNonEmptyString(body[field])) return `${label} is required`;
  if (body[field].length < MIN_PASSWORD_LENGTH) {
    return `${label} must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
};

const roleError = (body, field = "role") => {
  if (!isNonEmptyString(body[field])) return "Role is required";
  if (!hasRole(body[field])) return "Role is not supported";
  return null;
};

const collect = (...messages) => messages.filter(Boolean).map((message) => ({ message }));

const validateRegister = (body) => collect(
  requiredString(body, "organizationName", "Organization name"),
  requiredString(body, "name", "Name"),
  emailError(body),
  passwordError(body)
);

const validateLogin = (body) => collect(
  emailError(body),
  passwordError(body)
);

const validateChangePassword = (body) => collect(
  passwordError(body, "currentPassword", "Current password"),
  passwordError(body, "newPassword", "New password")
);

const validateCreateUser = (body) => collect(
  requiredString(body, "name", "Name"),
  emailError(body),
  passwordError(body),
  roleError(body)
);

const validateUpdateUser = (body) => collect(
  body.name !== undefined && !isNonEmptyString(body.name) ? "Name cannot be empty" : null,
  body.email !== undefined && emailError(body) ? emailError(body) : null,
  body.role !== undefined && roleError(body) ? roleError(body) : null,
  body.password !== undefined && passwordError(body) ? passwordError(body) : null
);

const validateUserStatus = (body) => {
  if (typeof body.isActive !== "boolean") return [{ message: "isActive must be a boolean" }];
  return [];
};

module.exports = {
  EMAIL_REGEX,
  MIN_PASSWORD_LENGTH,
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateCreateUser,
  validateUpdateUser,
  validateUserStatus,
};
