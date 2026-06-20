"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const task_controller_1 = require("../controllers/task.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const workspace_middleware_1 = require("../middleware/workspace.middleware");
const router = express_1.default.Router();
router.post("/create", auth_middleware_1.userauth, workspace_middleware_1.blockViewers, task_controller_1.createTaskController);
router.get("/project/:projectId", auth_middleware_1.userauth, task_controller_1.getProjectTasksController);
router.get("/project/:projectId/archived", auth_middleware_1.userauth, task_controller_1.getArchivedProjectTasksController);
router.get("/:taskId", auth_middleware_1.userauth, task_controller_1.getSingleTaskController);
router.put("/:taskId", auth_middleware_1.userauth, workspace_middleware_1.blockViewers, task_controller_1.updateTaskController);
router.delete("/:taskId", auth_middleware_1.userauth, workspace_middleware_1.blockViewers, task_controller_1.deleteTaskController);
// Time tracking
router.post("/:taskId/time-log", auth_middleware_1.userauth, workspace_middleware_1.blockViewers, task_controller_1.logTimeController);
router.delete("/:taskId/time-log/:logId", auth_middleware_1.userauth, workspace_middleware_1.blockViewers, task_controller_1.deleteTimeLogController);
// Bulk updates
router.post("/bulk-update", auth_middleware_1.userauth, workspace_middleware_1.blockViewers, task_controller_1.bulkUpdateController);
// Trash bin
router.get("/trash/list/:projectId", auth_middleware_1.userauth, task_controller_1.getTrashTasksController);
router.put("/:taskId/restore", auth_middleware_1.userauth, workspace_middleware_1.blockViewers, task_controller_1.restoreTaskController);
router.delete("/:taskId/permanent", auth_middleware_1.userauth, workspace_middleware_1.blockViewers, task_controller_1.deleteTaskPermanentlyController);
exports.default = router;
