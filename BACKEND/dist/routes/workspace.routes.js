"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const workspace_controller_1 = require("../controllers/workspace.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const workspace_middleware_1 = require("../middleware/workspace.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const workspace_validator_1 = require("../validator/workspace.validator");
const zod_1 = require("zod");
const router = express_1.default.Router();
// Create workspace
router.post("/create", auth_middleware_1.userauth, (0, validate_middleware_1.validate)(workspace_validator_1.createWorkspaceSchema), workspace_controller_1.createWorkspaceController);
// Get all workspaces of a user
router.get("/user/:userId", auth_middleware_1.userauth, workspace_controller_1.getUserWorkspacesController);
// Workspace details by ID
router.get("/:workspaceId", auth_middleware_1.userauth, workspace_controller_1.getWorkspaceByIdController);
// Update workspace details
router.put("/update/:workspaceId", auth_middleware_1.userauth, workspace_middleware_1.isWorkspaceAdmin, (0, validate_middleware_1.validate)(workspace_validator_1.updateWorkspaceSchema), workspace_controller_1.updateWorkspaceController);
// Add member to workspace
router.put("/:workspaceId/add-member", auth_middleware_1.userauth, workspace_middleware_1.isWorkspaceAdmin, (0, validate_middleware_1.validate)(workspace_validator_1.addWorkspaceMemberSchema), workspace_controller_1.addUserToWorkspaceController);
// Remove member from workspace
router.put("/:workspaceId/remove-member", auth_middleware_1.userauth, workspace_middleware_1.isWorkspaceAdmin, (0, validate_middleware_1.validate)(zod_1.z.object({ userId: zod_1.z.string() })), workspace_controller_1.removeUserFromWorkspaceController);
// Change workspace role of a member
router.put("/:workspaceId/change-role", auth_middleware_1.userauth, workspace_middleware_1.isWorkspaceAdmin, (0, validate_middleware_1.validate)(zod_1.z.object({ userId: zod_1.z.string(), role: zod_1.z.enum(["admin", "member"]) })), workspace_controller_1.changeWorkspaceRoleController);
// Leave workspace
router.put("/:workspaceId/leave", auth_middleware_1.userauth, workspace_controller_1.leaveWorkspaceController);
// Delete workspace
router.delete("/delete/:workspaceId", auth_middleware_1.userauth, workspace_middleware_1.isWorkspaceAdmin, workspace_controller_1.deleteWorkspaceController);
exports.default = router;
