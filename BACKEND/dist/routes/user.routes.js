"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express"); // Use import instead of require
const express_validator_1 = require("express-validator");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = (0, express_1.Router)();
router.post("/new/register", [
    (0, express_validator_1.body)("username.firstname")
        .isString()
        .withMessage("First name must be a string")
        .notEmpty(),
    (0, express_validator_1.body)("username.lastname")
        .isString()
        .withMessage("Last name must be a string")
        .notEmpty(),
    (0, express_validator_1.body)("email")
        .isEmail()
        .withMessage("Invalid email format")
        .notEmpty(),
    (0, express_validator_1.body)("password")
        .isLength({ min: 3 })
        .withMessage("Password must be at least 3 characters long")
        .notEmpty(),
    (0, express_validator_1.body)("phone")
        .isNumeric()
        .withMessage("Phone must be a number")
        .notEmpty()
        .withMessage("Phone number is required"),
    (0, express_validator_1.body)("gender")
        .isString()
        .withMessage("Gender is required")
        .notEmpty(),
    (0, express_validator_1.body)("usertype")
        .isIn(["individual", "team", "admin"])
        .withMessage("Invalid user type")
        .notEmpty()
], user_controller_1.signup);
router.post("/login", [
    (0, express_validator_1.body)("email").isEmail().withMessage("Invalid email format").notEmpty(),
    (0, express_validator_1.body)("password").isLength({ min: 3 }).withMessage("Password must be at least 3 characters long").notEmpty(),
], user_controller_1.login);
router.post("/update", [
    (0, express_validator_1.body)("email").isEmail().withMessage("Invalid email format").notEmpty(),
    (0, express_validator_1.body)("phone").isNumeric().withMessage("Phone must be a number").notEmpty(),
], auth_middleware_1.userauth, user_controller_1.updateUserProfile);
router.get('/forget-password', [
    (0, express_validator_1.body)("email").isEmail().withMessage("Invalid email format").notEmpty(),
], user_controller_1.forgetPass);
router.get("/profile", auth_middleware_1.userauth, user_controller_1.profile);
router.put("/preferences", auth_middleware_1.userauth, user_controller_1.updatePreferences);
router.post("/logout", auth_middleware_1.userauth, user_controller_1.logout);
// Pinning routes
router.post("/pin-project/:projectId", auth_middleware_1.userauth, user_controller_1.togglePinProjectController);
router.post("/pin-task/:taskId", auth_middleware_1.userauth, user_controller_1.togglePinTaskController);
router.get("/pinned", auth_middleware_1.userauth, user_controller_1.getPinnedItemsController);
// Profile avatar and saved filters routes
router.put("/profile/avatar", auth_middleware_1.userauth, upload_middleware_1.upload.single("avatar"), user_controller_1.updateAvatarController);
router.post("/saved-filters", auth_middleware_1.userauth, user_controller_1.saveFilterController);
router.get("/saved-filters/:projectId", auth_middleware_1.userauth, user_controller_1.getSavedFiltersController);
router.delete("/saved-filters/:filterId", auth_middleware_1.userauth, user_controller_1.deleteSavedFilterController);
exports.default = router;
