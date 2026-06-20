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
exports.getWorkspaceAnalytics = void 0;
const project_model_1 = __importDefault(require("../model/project.model"));
const task_model_1 = __importDefault(require("../model/task.model"));
const workspace_model_1 = __importDefault(require("../model/workspace.model"));
const getWorkspaceAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const { workspaceId } = req.params;
        // Fetch projects in workspace
        const projects = yield project_model_1.default.find({ workspace: workspaceId });
        const projectIds = projects.map((p) => p._id);
        // Fetch all tasks for those projects
        const tasks = yield task_model_1.default.find({
            project: { $in: projectIds },
            isArchived: { $ne: true },
        }).populate("assignedTo", "username email");
        // Calculate totals
        const total = tasks.length;
        const completed = tasks.filter((t) => t.status === "completed").length;
        const inProgress = tasks.filter((t) => t.status === "in-progress").length;
        const todo = tasks.filter((t) => t.status === "todo").length;
        const now = new Date();
        const overdue = tasks.filter((t) => t.status !== "completed" && t.dueDate && new Date(t.dueDate) < now).length;
        // Productivity aggregation
        const productivity = {};
        const workspace = yield workspace_model_1.default.findById(workspaceId).populate("members.user", "username email");
        if (workspace) {
            for (const member of workspace.members) {
                const userObj = member.user;
                if (userObj) {
                    const fullName = `${((_a = userObj.username) === null || _a === void 0 ? void 0 : _a.firstname) || ""} ${((_b = userObj.username) === null || _b === void 0 ? void 0 : _b.lastname) || ""}`.trim();
                    productivity[userObj._id.toString()] = {
                        name: fullName || userObj.email,
                        email: userObj.email,
                        completedCount: 0,
                        totalCount: 0,
                    };
                }
            }
        }
        for (const task of tasks) {
            if (task.assignedTo && Array.isArray(task.assignedTo)) {
                for (const assignee of task.assignedTo) {
                    const assigneeId = ((_c = assignee._id) === null || _c === void 0 ? void 0 : _c.toString()) || assignee.toString();
                    if (productivity[assigneeId]) {
                        productivity[assigneeId].totalCount++;
                        if (task.status === "completed") {
                            productivity[assigneeId].completedCount++;
                        }
                    }
                }
            }
        }
        const productivityList = Object.keys(productivity)
            .map((id) => (Object.assign({ userId: id }, productivity[id])))
            .sort((a, b) => b.completedCount - a.completedCount);
        // Project breakdown
        const projectBreakdown = projects.map((p) => {
            const projectTasks = tasks.filter((t) => t.project.toString() === p._id.toString());
            return {
                projectId: p._id,
                title: p.name,
                color: p.color || "#6C63FF",
                total: projectTasks.length,
                completed: projectTasks.filter((t) => t.status === "completed").length,
                inProgress: projectTasks.filter((t) => t.status === "in-progress").length,
                todo: projectTasks.filter((t) => t.status === "todo").length,
                overdue: projectTasks.filter((t) => t.status !== "completed" && t.dueDate && new Date(t.dueDate) < now).length,
            };
        });
        const userIdStr = ((_e = (_d = req.user) === null || _d === void 0 ? void 0 : _d._id) === null || _e === void 0 ? void 0 : _e.toString()) || "";
        const myTasks = tasks.filter(t => t.assignedTo && Array.isArray(t.assignedTo) && t.assignedTo.some((a) => { var _a; return (((_a = a._id) === null || _a === void 0 ? void 0 : _a.toString()) || a.toString()) === userIdStr; }));
        const myTotal = myTasks.length;
        const myCompleted = myTasks.filter(t => t.status === "completed").length;
        const myOverdue = myTasks.filter(t => t.status !== "completed" && t.dueDate && new Date(t.dueDate) < now).length;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const myCompletedThisWeek = myTasks.filter(t => t.status === "completed" && t.updatedAt && new Date(t.updatedAt) >= oneWeekAgo).length;
        return res.status(200).json({
            success: true,
            analytics: {
                summary: {
                    total,
                    completed,
                    inProgress,
                    todo,
                    overdue,
                },
                productivity: productivityList,
                projects: projectBreakdown,
                personal: {
                    total: myTotal,
                    completed: myCompleted,
                    overdue: myOverdue,
                    completedThisWeek: myCompletedThisWeek,
                    completionRate: myTotal > 0 ? Math.round((myCompleted / myTotal) * 100) : 0
                }
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch workspace analytics",
        });
    }
});
exports.getWorkspaceAnalytics = getWorkspaceAnalytics;
