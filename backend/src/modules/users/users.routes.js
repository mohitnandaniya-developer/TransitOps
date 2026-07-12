const express = require("express");
const usersService = require("./users.service");
const authenticate = require("../../middleware/authenticate");
const authorizeRoles = require("../../middleware/authorizeRoles");
const validateRequest = require("../../middleware/validateRequest");
const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/responses");
const { ROLES } = require("../../utils/roles");
const {
  validateCreateUser,
  validateUpdateUser,
  validateUserStatus,
} = require("../../utils/validators");

const router = express.Router();

router.use(authenticate, authorizeRoles(ROLES.FLEET_MANAGER));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const users = await usersService.listUsers(req.user.organizationId);
    return success(res, { users });
  })
);

router.post(
  "/",
  validateRequest({ body: validateCreateUser }),
  asyncHandler(async (req, res) => {
    const user = await usersService.createUser(req.user.organizationId, req.body);
    return success(res, { user }, "User created", 201);
  })
);

router.put(
  "/:id",
  validateRequest({ body: validateUpdateUser }),
  asyncHandler(async (req, res) => {
    const user = await usersService.updateUser(req.user.organizationId, req.params.id, req.body);
    return success(res, { user }, "User updated");
  })
);

router.patch(
  "/:id/status",
  validateRequest({ body: validateUserStatus }),
  asyncHandler(async (req, res) => {
    const user = await usersService.setUserStatus(req.user.organizationId, req.params.id, req.body.isActive);
    return success(res, { user }, "User status updated");
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await usersService.deleteUser(req.user.organizationId, req.params.id, req.user.id);
    return success(res, {}, "User deleted");
  })
);

module.exports = router;
