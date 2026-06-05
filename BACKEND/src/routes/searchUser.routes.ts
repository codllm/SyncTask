import { Router } from "express";
import { userauth } from "../middleware/auth.middleware";
import {
  searchUsersController,
  searchWorkspacesController,
  searchProjectsController,
  searchTasksController,
  globalSearchController
} from "../controllers/searchUser.controller";

const router = Router();

// Individual search endpoints
router.get("/users", userauth, searchUsersController);
router.get("/workspaces", userauth, searchWorkspacesController);
router.get("/projects", userauth, searchProjectsController);
router.get("/tasks", userauth, searchTasksController);

// Unified global search endpoint
router.get("/global", userauth, globalSearchController);

// Keep the old route for backwards compatibility if needed by frontend
router.get("/user/suggestion/:query", userauth, searchUsersController);

export default router;