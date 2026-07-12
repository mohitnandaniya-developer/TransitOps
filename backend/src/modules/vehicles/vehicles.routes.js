const express = require("express");
const vehiclesService = require("./vehicles.service");
const authenticate = require("../../middleware/authenticate");
const authorizeRoles = require("../../middleware/authorizeRoles");
const validateRequest = require("../../middleware/validateRequest");
const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/responses");
const { ROLES } = require("../../utils/roles");
const {
  validateCreateVehicle,
  validateUpdateVehicle,
  validateVehicleStatus,
} = require("../../utils/validators");

const router = express.Router();

const canViewVehicles = [
  ROLES.FLEET_MANAGER,
  ROLES.DISPATCHER,
];

router.use(authenticate);

router.get(
  "/",
  authorizeRoles(...canViewVehicles),
  asyncHandler(async (req, res) => {
    const vehicles = await vehiclesService.listVehicles(req.user.organizationId, req.query);
    return success(res, { vehicles });
  })
);

router.get(
  "/:id",
  authorizeRoles(...canViewVehicles),
  asyncHandler(async (req, res) => {
    const vehicle = await vehiclesService.getVehicle(req.user.organizationId, req.params.id);
    return success(res, { vehicle });
  })
);

router.post(
  "/",
  authorizeRoles(ROLES.FLEET_MANAGER),
  validateRequest({ body: validateCreateVehicle }),
  asyncHandler(async (req, res) => {
    const vehicle = await vehiclesService.createVehicle(req.user.organizationId, req.user.id, req.body);
    return success(res, { vehicle }, "Vehicle created", 201);
  })
);

router.put(
  "/:id",
  authorizeRoles(ROLES.FLEET_MANAGER),
  validateRequest({ body: validateUpdateVehicle }),
  asyncHandler(async (req, res) => {
    const vehicle = await vehiclesService.updateVehicle(req.user.organizationId, req.params.id, req.body);
    return success(res, { vehicle }, "Vehicle updated");
  })
);

router.patch(
  "/:id/status",
  authorizeRoles(ROLES.FLEET_MANAGER),
  validateRequest({ body: validateVehicleStatus }),
  asyncHandler(async (req, res) => {
    const vehicle = await vehiclesService.updateVehicleStatus(
      req.user.organizationId,
      req.params.id,
      req.body.status
    );
    return success(res, { vehicle }, "Vehicle status updated");
  })
);

router.delete(
  "/:id",
  authorizeRoles(ROLES.FLEET_MANAGER),
  asyncHandler(async (req, res) => {
    const vehicle = await vehiclesService.retireVehicle(req.user.organizationId, req.params.id);
    return success(res, { vehicle }, "Vehicle retired");
  })
);

module.exports = router;
