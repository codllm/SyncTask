import { Router } from "express";
import { userauth } from "../middleware/auth.middleware";
import { getProjectAnalyticsController } from "../controllers/analytics.controller";

const router = Router();

// Get task analytics/graphs data for a specific project
router.get("/:projectId", userauth, getProjectAnalyticsController);

export default router;
