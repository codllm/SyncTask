"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const notification_controller_1 = require("../controllers/notification.controller");
const router = (0, express_1.Router)();
// Retrieve notifications for authenticated user
router.get("/", auth_middleware_1.userauth, notification_controller_1.getNotificationsController);
// Bulk mark all notifications as read
router.put("/read-all", auth_middleware_1.userauth, notification_controller_1.markAllReadController);
// Mark a single notification as read
router.put("/:notificationId/read", auth_middleware_1.userauth, notification_controller_1.markReadController);
exports.default = router;
