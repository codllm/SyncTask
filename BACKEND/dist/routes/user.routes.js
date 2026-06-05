"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const user_validator_1 = require("../validator/user.validator");
const router = (0, express_1.Router)();
// Register a new user
router.post("/new/register", (0, validate_middleware_1.validate)(user_validator_1.registerUserSchema), user_controller_1.signup);
// User login
router.post("/login", (0, validate_middleware_1.validate)(user_validator_1.loginUserSchema), user_controller_1.login);
// Update user details
router.post("/update", auth_middleware_1.userauth, (0, validate_middleware_1.validate)(user_validator_1.updateUserSchema), user_controller_1.updateUserProfile);
// Forget/reset password
router.post("/forget-password", (0, validate_middleware_1.validate)(user_validator_1.forgetPasswordSchema), user_controller_1.forgetPass);
// Get profile
router.get("/profile", auth_middleware_1.userauth, user_controller_1.profile);
// Logout user
router.post("/logout", auth_middleware_1.userauth, user_controller_1.logout);
exports.default = router;
