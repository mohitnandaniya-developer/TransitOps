const express = require("express");
const authService = require("./auth.service");
const authenticate = require("../../middleware/authenticate");
const validateRequest = require("../../middleware/validateRequest");
const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/responses");
const {
  validateRegister,
  validateLogin,
  validateChangePassword,
} = require("../../utils/validators");

const router = express.Router();

router.post(
  "/register",
  validateRequest({ body: validateRegister }),
  asyncHandler(async (req, res) => {
    const data = await authService.register(req.body);
    return success(res, data, "Organization and fleet manager created", 201);
  })
);

router.post(
  "/login",
  validateRequest({ body: validateLogin }),
  asyncHandler(async (req, res) => {
    const data = await authService.login(req.body);
    return success(res, data, "Login successful");
  })
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const data = await authService.getCurrentUser(req.user.id, req.user.organizationId);
    return success(res, data);
  })
);

router.post(
  "/change-password",
  authenticate,
  validateRequest({ body: validateChangePassword }),
  asyncHandler(async (req, res) => {
    await authService.changePassword(
      req.user.id,
      req.user.organizationId,
      req.body.currentPassword,
      req.body.newPassword
    );
    return success(res, {}, "Password changed successfully");
  })
);

module.exports = router;
