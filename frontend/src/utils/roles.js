export const ROLES = Object.freeze({
  FLEET_MANAGER: "fleet_manager",
  DISPATCHER: "dispatcher",
  SAFETY_OFFICER: "safety_officer",
  FINANCIAL_ANALYST: "financial_analyst",
});

export const ROLE_VALUES = Object.freeze(Object.values(ROLES));

export const ROLE_LABELS = Object.freeze({
  [ROLES.FLEET_MANAGER]: "Fleet Manager",
  [ROLES.DISPATCHER]: "Dispatcher",
  [ROLES.SAFETY_OFFICER]: "Safety Officer",
  [ROLES.FINANCIAL_ANALYST]: "Financial Analyst",
});

export const PAGE_PERMISSIONS = Object.freeze({
  dashboard: ROLE_VALUES,
  vehicles: [ROLES.FLEET_MANAGER, ROLES.DISPATCHER],
  drivers: [ROLES.FLEET_MANAGER, ROLES.DISPATCHER, ROLES.SAFETY_OFFICER],
  trips: [ROLES.FLEET_MANAGER, ROLES.DISPATCHER],
  maintenance: [ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER],
  fuelExpenses: [ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST],
  analytics: [ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST],
  users: [ROLES.FLEET_MANAGER],
});

export const NAV_ITEMS = Object.freeze([
  { key: "dashboard", label: "Dashboard", path: "/dashboard", marker: "D" },
  { key: "vehicles", label: "Vehicles", path: "/vehicles", marker: "V" },
  { key: "drivers", label: "Drivers", path: "/drivers", marker: "R" },
  { key: "trips", label: "Trips", path: "/trips", marker: "T" },
  { key: "maintenance", label: "Maintenance", path: "/maintenance", marker: "M" },
  { key: "fuelExpenses", label: "Fuel Expenses", path: "/fuel-expenses", marker: "F" },
  { key: "analytics", label: "Analytics", path: "/analytics", marker: "A" },
  { key: "users", label: "Users", path: "/users", marker: "U" },
]);

export function canAccess(role, pageKey) {
  return PAGE_PERMISSIONS[pageKey]?.includes(role) ?? false;
}
