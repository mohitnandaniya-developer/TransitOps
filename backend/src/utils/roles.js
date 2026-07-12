const ROLES = Object.freeze({
  FLEET_MANAGER: "fleet_manager",
  DISPATCHER: "dispatcher",
  SAFETY_OFFICER: "safety_officer",
  FINANCIAL_ANALYST: "financial_analyst",
});

const ROLE_VALUES = Object.freeze(Object.values(ROLES));

const ROLE_LABELS = Object.freeze({
  [ROLES.FLEET_MANAGER]: "Fleet Manager",
  [ROLES.DISPATCHER]: "Dispatcher",
  [ROLES.SAFETY_OFFICER]: "Safety Officer",
  [ROLES.FINANCIAL_ANALYST]: "Financial Analyst",
});

const hasRole = (role) => ROLE_VALUES.includes(role);

module.exports = {
  ROLES,
  ROLE_VALUES,
  ROLE_LABELS,
  hasRole,
};
