"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const task_controller_1 = require("../controllers/task.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const workspace_middleware_1 = require("../middleware/workspace.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const task_validator_1 = require("../validator/task.validator");
const router = express_1.default.Router();
// Create a new task (restricted to project members/workspace admins)
router.post("/create", auth_middleware_1.userauth, workspace_middleware_1.isProjectMember, (0, validate_middleware_1.validate)(task_validator_1.createTaskSchema), task_controller_1.createTaskController);
// Get all tasks of a project (accessible to project members)
router.get("/project/:projectId", auth_middleware_1.userauth, workspace_middleware_1.isProjectMember, task_controller_1.getProjectTasksController);
// Get details of a single task (accessible to project members)
router.get("/:taskId", auth_middleware_1.userauth, workspace_middleware_1.isProjectMember, task_controller_1.getSingleTaskController);
// Update a task (restricted to project members)
router.put("/:taskId", auth_middleware_1.userauth, workspace_middleware_1.isProjectMember, (0, validate_middleware_1.validate)(task_validator_1.updateTaskSchema), task_controller_1.updateTaskController);
// Delete a task (restricted to project members)
router.delete("/:taskId", auth_middleware_1.userauth, workspace_middleware_1.isProjectMember, task_controller_1.deleteTaskController);
exports.default = router;
