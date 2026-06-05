"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const project_controller_1 = require("../controllers/project.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const workspace_middleware_1 = require("../middleware/workspace.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const project_validator_1 = require("../validator/project.validator");
const zod_1 = require("zod");
const router = express_1.default.Router();
// Create project in a workspace (restricted to workspace admins)
router.post("/create", auth_middleware_1.userauth, workspace_middleware_1.isWorkspaceAdmin, (0, validate_middleware_1.validate)(project_validator_1.createProjectSchema), project_controller_1.createProjectController);
// Get single project details (accessible to workspace members)
router.get("/:projectId", auth_middleware_1.userauth, workspace_middleware_1.isWorkspaceMember, project_controller_1.getProjectByIdController);
// Get all projects of a workspace (accessible to workspace members)
router.get("/workspace/:workspaceId", auth_middleware_1.userauth, workspace_middleware_1.isWorkspaceMember, project_controller_1.getWorkspaceProjectsController);
// Update project (restricted to workspace admins)
router.put("/update/:projectId", auth_middleware_1.userauth, workspace_middleware_1.isWorkspaceAdmin, (0, validate_middleware_1.validate)(project_validator_1.updateProjectSchema), project_controller_1.updateProjectController);
// Delete project (restricted to workspace admins)
router.delete("/delete/:projectId", auth_middleware_1.userauth, workspace_middleware_1.isWorkspaceAdmin, project_controller_1.deleteProjectController);
// Add member to project (restricted to workspace admins)
router.put("/:projectId/add-member", auth_middleware_1.userauth, workspace_middleware_1.isWorkspaceAdmin, (0, validate_middleware_1.validate)(project_validator_1.addProjectMemberSchema), project_controller_1.addMemberToProjectController);
// Remove member from project (restricted to workspace admins)
router.put("/:projectId/remove-member", auth_middleware_1.userauth, workspace_middleware_1.isWorkspaceAdmin, (0, validate_middleware_1.validate)(zod_1.z.object({ userId: zod_1.z.string() })), project_controller_1.removeMemberFromProjectController);
// Change role of project member (restricted to workspace admins)
router.put("/:projectId/change-role", auth_middleware_1.userauth, workspace_middleware_1.isWorkspaceAdmin, (0, validate_middleware_1.validate)(zod_1.z.object({ userId: zod_1.z.string(), role: zod_1.z.enum(["admin", "member"]) })), project_controller_1.changeProjectRoleController);
// Get all members of a project (accessible to workspace members)
router.get("/members/:projectId", auth_middleware_1.userauth, workspace_middleware_1.isWorkspaceMember, project_controller_1.getProjectMembersController);
exports.default = router;
