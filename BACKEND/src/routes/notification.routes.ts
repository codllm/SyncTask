import { Router } from "express";
import { userauth } from "../middleware/auth.middleware";
import {
  createNotificationController,
  getNotificationsController,
  markAsReadController,
  markAllAsReadController,
} from "../controllers/notification.controller";

const router = Router();

// Retrieve notifications for authenticated user (can filter by ?type=...)
router.get("/", userauth, getNotificationsController);

// Specific routes for each notification type as previously requested
router.get("/task-assigned", userauth, (req, res) => { req.query.type = "TASK_ASSIGNED"; return getNotificationsController(req, res); });
router.get("/task-updated", userauth, (req, res) => { req.query.type = "TASK_UPDATED"; return getNotificationsController(req, res); });
router.get("/project-added", userauth, (req, res) => { req.query.type = "PROJECT_ADDED"; return getNotificationsController(req, res); });
router.get("/workspace-invite", userauth, (req, res) => { req.query.type = "WORKSPACE_INVITE"; return getNotificationsController(req, res); });
router.get("/comment-added", userauth, (req, res) => { req.query.type = "COMMENT_ADDED"; return getNotificationsController(req, res); });

// Create a new notification manually
router.post("/create", userauth, createNotificationController);

// Mark specific notification as read
router.put("/:notificationId/read", userauth, markAsReadController);

// Mark all as read
router.put("/read-all", userauth, markAllAsReadController);

export default router;
