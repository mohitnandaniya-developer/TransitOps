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

const VEHICLE_TYPES = ["truck", "mini_truck", "van", "bike"];
const VEHICLE_STATUSES = ["available", "on_trip", "maintenance", "out_of_service", "retired"];

const positiveNumberError = (body, field, label = field, { required = true, allowZero = false } = {}) => {
  if (body[field] === undefined || body[field] === null || body[field] === "") {
    return required ? `${label} is required` : null;
  }

  const value = Number(body[field]);
  if (!Number.isFinite(value)) return `${label} must be a number`;
  if (allowZero ? value < 0 : value <= 0) return `${label} must be ${allowZero ? "zero or greater" : "greater than zero"}`;
  return null;
};

const optionError = (body, field, options, label = field, { required = true } = {}) => {
  if (!isNonEmptyString(body[field])) return required ? `${label} is required` : null;
  if (!options.includes(body[field])) return `${label} is not supported`;
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

const validateCreateVehicle = (body) => collect(
  requiredString(body, "name", "Vehicle name"),
  optionError(body, "type", VEHICLE_TYPES, "Vehicle type"),
  requiredString(body, "plate", "Plate"),
  positiveNumberError(body, "capacityKg", "Capacity"),
  positiveNumberError(body, "odometerKm", "Odometer", { required: false, allowZero: true }),
  optionError(body, "status", VEHICLE_STATUSES, "Status", { required: false }),
  positiveNumberError(body, "pricePerKm", "Price per km", { required: false, allowZero: true }),
  body.retired !== undefined && typeof body.retired !== "boolean" ? "retired must be a boolean" : null
);

const validateUpdateVehicle = (body) => collect(
  body.name !== undefined && !isNonEmptyString(body.name) ? "Vehicle name cannot be empty" : null,
  body.type !== undefined ? optionError(body, "type", VEHICLE_TYPES, "Vehicle type") : null,
  body.plate !== undefined && !isNonEmptyString(body.plate) ? "Plate cannot be empty" : null,
  body.capacityKg !== undefined ? positiveNumberError(body, "capacityKg", "Capacity") : null,
  body.odometerKm !== undefined ? positiveNumberError(body, "odometerKm", "Odometer", { allowZero: true }) : null,
  body.status !== undefined ? optionError(body, "status", VEHICLE_STATUSES, "Status") : null,
  body.pricePerKm !== undefined ? positiveNumberError(body, "pricePerKm", "Price per km", { allowZero: true }) : null,
  body.retired !== undefined && typeof body.retired !== "boolean" ? "retired must be a boolean" : null
);

const validateVehicleStatus = (body) => collect(
  optionError(body, "status", VEHICLE_STATUSES, "Status")
);

module.exports = {
  EMAIL_REGEX,
  MIN_PASSWORD_LENGTH,
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateCreateUser,
  validateUpdateUser,
  validateUserStatus,
  validateCreateVehicle,
  validateUpdateVehicle,
  validateVehicleStatus,
};
