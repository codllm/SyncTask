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
exports.blockViewers = exports.isWorkspaceAdmin = void 0;
const workspace_model_1 = __importDefault(require("../model/workspace.model"));
const project_model_1 = __importDefault(require("../model/project.model"));
const isWorkspaceAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        let workspaceId = req.params.workspaceId;
        // Support routes like deleteProject where workspaceId is not in parameters
        if (!workspaceId && req.params.projectId) {
            const project = yield project_model_1.default.findById(req.params.projectId);
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found",
                });
            }
            workspaceId = project.workspace.toString();
        }
        if (!workspaceId) {
            return res.status(400).json({
                success: false,
                message: "Workspace ID is required",
            });
        }
        const workspace = yield workspace_model_1.default.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found",
            });
        }
        const member = workspace.members.find((member) => member.user.toString() ===
            user._id.toString());
        if (!member || member.status === "pending") {
            return res.status(403).json({
                success: false,
                message: "Access denied",
            });
        }
        if (member.role !== "owner" &&
            member.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only owner/admin allowed",
            });
        }
        next();
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.isWorkspaceAdmin = isWorkspaceAdmin;
const blockViewers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const userId = user._id.toString();
        let { workspaceId, projectId, taskId, commentId } = req.params;
        // Fallback to request body for creation routes
        if (!projectId && req.body.project) {
            projectId = req.body.project;
        }
        if (!workspaceId && req.body.workspace) {
            workspaceId = req.body.workspace;
        }
        if (commentId) {
            const Comment = require("../model/comment.model").default;
            const comment = yield Comment.findById(commentId).populate("task");
            if (comment && comment.task) {
                taskId = comment.task._id.toString();
            }
        }
        if (taskId) {
            const Task = require("../model/task.model").default;
            const task = yield Task.findById(taskId);
            if (task) {
                projectId = task.project.toString();
            }
        }
        if (projectId) {
            const Project = require("../model/project.model").default;
            const project = yield Project.findById(projectId);
            if (project) {
                const projectMember = project.members.find((m) => m.user.toString() === userId);
                if (projectMember && projectMember.role === "viewer") {
                    return res.status(403).json({
                        success: false,
                        message: "Action forbidden: View-only role",
                    });
                }
                workspaceId = project.workspace.toString();
            }
        }
        if (workspaceId) {
            const Workspace = require("../model/workspace.model").default;
            const workspace = yield Workspace.findById(workspaceId);
            if (workspace) {
                const workspaceMember = workspace.members.find((m) => m.user.toString() === userId);
                if (!workspaceMember || workspaceMember.status === "pending") {
                    return res.status(403).json({
                        success: false,
                        message: "Access denied",
                    });
                }
                if (workspaceMember.role === "viewer") {
                    return res.status(403).json({
                        success: false,
                        message: "Action forbidden: View-only role in workspace",
                    });
                }
            }
        }
        next();
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to check viewer permissions",
        });
    }
});
exports.blockViewers = blockViewers;
