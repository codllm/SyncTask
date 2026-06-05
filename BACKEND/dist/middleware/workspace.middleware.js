"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProjectMember = exports.isWorkspaceMember = exports.isWorkspaceAdmin = void 0;
const workspace_model_1 = __importDefault(require("../model/workspace.model"));
const project_model_1 = __importDefault(require("../model/project.model"));
const task_model_1 = __importDefault(require("../model/task.model"));
const comment_model_1 = __importDefault(require("../model/comment.model"));
/**
 * Helper to dynamically resolve workspace ID from route parameters or request body
 */
const resolveWorkspaceId = (req) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Check workspaceId in parameters or body
    if (req.params.workspaceId)
        return String(req.params.workspaceId);
    if (req.body.workspaceId)
        return String(req.body.workspaceId);
    if (req.body.workspace)
        return String(req.body.workspace);
    // 2. Check projectId in parameters or body
    const projectId = req.params.projectId || req.body.projectId || req.body.project;
    if (projectId) {
        const project = yield project_model_1.default.findById(String(projectId));
        if (project)
            return project.workspace.toString();
    }
    // 3. Check taskId in parameters or body
    const taskId = req.params.taskId || req.body.taskId || req.body.task;
    if (taskId) {
        const task = yield task_model_1.default.findById(String(taskId)).populate("project");
        if (task && task.project) {
            return task.project.workspace.toString();
        }
    }
    // 4. Check commentId in parameters
    const commentId = req.params.commentId;
    if (commentId) {
        const comment = yield comment_model_1.default.findById(String(commentId)).populate({
            path: "task",
            populate: { path: "project" },
        });
        if (comment && comment.task && comment.task.project) {
            return comment.task.project.workspace.toString();
        }
    }
    return null;
});
/**
 * Middleware: Verify user is Owner or Admin of the workspace
 */
const isWorkspaceAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const workspaceId = yield resolveWorkspaceId(req);
        if (!workspaceId) {
            return res.status(400).json({
                success: false,
                message: "Could not resolve workspace context",
            });
        }
        const workspace = yield workspace_model_1.default.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found",
            });
        }
        const member = workspace.members.find((m) => m.user.toString() === user._id.toString());
        if (!member) {
            return res.status(403).json({
                success: false,
                message: "Access denied: Not a member of this workspace",
            });
        }
        if (member.role !== "owner" && member.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied: Only workspace owner/admin allowed",
            });
        }
        // Attach workspace for downstream controllers
        req.workspace = workspace;
        next();
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.isWorkspaceAdmin = isWorkspaceAdmin;
/**
 * Middleware: Verify user is a Member (or admin/owner) of the workspace
 */
const isWorkspaceMember = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const workspaceId = yield resolveWorkspaceId(req);
        if (!workspaceId) {
            return res.status(400).json({
                success: false,
                message: "Could not resolve workspace context",
            });
        }
        const workspace = yield workspace_model_1.default.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found",
            });
        }
        const isMember = workspace.members.some((m) => m.user.toString() === user._id.toString());
        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "Access denied: You are not a member of this workspace",
            });
        }
        req.workspace = workspace;
        next();
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.isWorkspaceMember = isWorkspaceMember;
/**
 * Middleware: Verify user is a member of the project or workspace owner/admin
 */
const isProjectMember = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const projectIdRaw = req.params.projectId || req.body.projectId || req.body.project;
        if (!projectIdRaw) {
            return res.status(400).json({
                success: false,
                message: "Could not resolve project context",
            });
        }
        const projectId = String(projectIdRaw);
        const project = yield project_model_1.default.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }
        // 1. Check workspace owner/admin role (they bypass project membership restriction)
        const workspace = yield workspace_model_1.default.findById(project.workspace);
        if (workspace) {
            const workspaceMember = workspace.members.find((m) => m.user.toString() === user._id.toString());
            if (workspaceMember && (workspaceMember.role === "owner" || workspaceMember.role === "admin")) {
                req.project = project;
                return next();
            }
        }
        // 2. Check direct project membership
        const isProjMember = project.members.some((m) => m.user.toString() === user._id.toString());
        if (!isProjMember) {
            return res.status(403).json({
                success: false,
                message: "Access denied: You are not assigned/member of this project",
            });
        }
        req.project = project;
        next();
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.isProjectMember = isProjectMember;
