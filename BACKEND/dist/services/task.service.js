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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTaskPermanentlyService = exports.restoreTaskService = exports.getTrashTasksService = exports.bulkUpdateTasksService = exports.deleteTimeLogService = exports.logTimeService = exports.getArchivedProjectTasksService = exports.deleteTaskService = exports.updateTaskService = exports.getSingleTaskService = exports.getProjectTasksService = exports.createTaskService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const task_model_1 = __importDefault(require("../model/task.model"));
const project_model_1 = __importDefault(require("../model/project.model"));
const comment_model_1 = __importDefault(require("../model/comment.model"));
const notification_service_1 = require("./notification.service");
const socket_1 = require("./socket");
const activity_service_1 = require("./activity.service");
const scheduler_1 = require("./scheduler");
const mention_service_1 = require("./mention.service");
const createTaskService = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const status = data.status || "todo";
    const count = yield task_model_1.default.countDocuments({ project: data.project, status });
    if (data.recurring && data.recurring.isRecurring && !data.recurring.nextRun) {
        data.recurring.nextRun = (0, scheduler_1.calculateNextRun)(data.recurring.frequency);
    }
    const task = yield task_model_1.default.create(Object.assign(Object.assign({}, data), { position: count }));
    const populatedTask = yield task_model_1.default.findById(task._id)
        .populate("assignedTo", "username email")
        .populate("createdBy", "username email");
    if (!populatedTask) {
        throw new Error("Failed to populate created task");
    }
    (0, socket_1.emitToProject)(populatedTask.project.toString(), "task:created", populatedTask);
    const project = yield project_model_1.default.findById(populatedTask.project);
    if (project) {
        yield (0, activity_service_1.createActivityLog)({
            workspace: project.workspace.toString(),
            project: project._id.toString(),
            task: populatedTask._id.toString(),
            user: populatedTask.createdBy._id.toString(),
            action: "task_created",
            details: `created task "${populatedTask.title}"`,
        });
    }
    if (populatedTask.assignedTo && Array.isArray(populatedTask.assignedTo)) {
        for (const assignee of populatedTask.assignedTo) {
            const assigneeId = assignee._id.toString();
            if (assigneeId !== populatedTask.createdBy._id.toString()) {
                yield (0, notification_service_1.createNotification)({
                    recipient: assigneeId,
                    sender: populatedTask.createdBy._id.toString(),
                    type: "TASK_ASSIGNED",
                    title: "New Task Assigned",
                    message: `You have been assigned to the task: "${populatedTask.title}"`,
                    link: `/projects/${populatedTask.project}/tasks/${populatedTask._id}`,
                });
            }
        }
    }
    if (populatedTask.description) {
        yield (0, mention_service_1.parseAndNotifyMentions)(populatedTask.description, populatedTask.createdBy._id.toString(), populatedTask, false);
    }
    return Object.assign(Object.assign({}, populatedTask.toObject()), { commentsCount: 0 });
});
exports.createTaskService = createTaskService;
const getProjectTasksService = (projectId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const project = yield project_model_1.default.findById(projectId);
    const isProjectAdmin = project && (project.createdBy.toString() === userId.toString() ||
        project.members.some(m => m.user.toString() === userId.toString() && m.role === "admin"));
    let query = { project: projectId, isArchived: { $ne: true }, isDeleted: { $ne: true } };
    if (!isProjectAdmin) {
        query.$or = [
            { assignedTo: { $exists: false } },
            { assignedTo: null },
            { assignedTo: { $size: 0 } },
            { assignedTo: userId },
            { createdBy: userId }
        ];
    }
    const tasks = yield task_model_1.default.find(query)
        .sort({ position: 1 })
        .populate("assignedTo", "username email")
        .populate("createdBy", "username email");
    const tasksWithComments = yield Promise.all(tasks.map((task) => __awaiter(void 0, void 0, void 0, function* () {
        const commentsCount = yield comment_model_1.default.countDocuments({ task: task._id });
        return Object.assign(Object.assign({}, task.toObject()), { commentsCount });
    })));
    return tasksWithComments;
});
exports.getProjectTasksService = getProjectTasksService;
const getSingleTaskService = (taskId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield task_model_1.default.findById(taskId)
        .populate("assignedTo", "username email")
        .populate("createdBy", "username email");
    if (!task || task.isDeleted) {
        return null;
    }
    const project = yield project_model_1.default.findById(task.project);
    const isProjectAdmin = project && (project.createdBy.toString() === userId.toString() ||
        project.members.some(m => m.user.toString() === userId.toString() && m.role === "admin"));
    const assigneesList = task.assignedTo ? task.assignedTo.map(a => a._id.toString()) : [];
    const isAssigned = assigneesList.includes(userId.toString());
    const isCreator = task.createdBy._id.toString() === userId.toString();
    const isUnassigned = assigneesList.length === 0;
    if (!isProjectAdmin && !isAssigned && !isCreator && !isUnassigned) {
        throw new Error("Unauthorized to access this task");
    }
    const commentsCount = yield comment_model_1.default.countDocuments({ task: task._id });
    return Object.assign(Object.assign({}, task.toObject()), { commentsCount });
});
exports.getSingleTaskService = getSingleTaskService;
const updateTaskService = (taskId, data, updaterId) => __awaiter(void 0, void 0, void 0, function* () {
    const originalTask = yield task_model_1.default.findById(taskId);
    if (!originalTask) {
        throw new Error("Task not found");
    }
    const { newAttachments } = data, updateData = __rest(data, ["newAttachments"]);
    if (updateData.recurring && updateData.recurring.isRecurring && !updateData.recurring.nextRun) {
        updateData.recurring.nextRun = (0, scheduler_1.calculateNextRun)(updateData.recurring.frequency);
    }
    // Check for task dependency blocks
    if (updateData.status === "completed") {
        const checkDeps = updateData.dependencies || originalTask.dependencies;
        if (checkDeps && checkDeps.length > 0) {
            const incompleteDeps = yield task_model_1.default.find({
                _id: { $in: checkDeps },
                status: { $ne: "completed" },
                isArchived: { $ne: true },
            });
            if (incompleteDeps.length > 0) {
                const depTitles = incompleteDeps.map(d => `"${d.title}"`).join(", ");
                throw new Error(`Cannot complete task. It is blocked by incomplete dependencies: ${depTitles}`);
            }
        }
    }
    // Handle status/position reordering
    if (updateData.status !== undefined || updateData.position !== undefined) {
        const sourceStatus = originalTask.status;
        const targetStatus = updateData.status !== undefined ? updateData.status : sourceStatus;
        const originalPos = originalTask.position;
        // Determine target position
        let targetPos = updateData.position !== undefined ? updateData.position : 0;
        if (updateData.position === undefined) {
            if (sourceStatus !== targetStatus) {
                targetPos = yield task_model_1.default.countDocuments({ project: originalTask.project, status: targetStatus });
            }
            else {
                targetPos = originalPos;
            }
        }
        if (sourceStatus !== targetStatus) {
            // Shift tasks in source column down
            yield task_model_1.default.updateMany({ project: originalTask.project, status: sourceStatus, position: { $gt: originalPos } }, { $inc: { position: -1 } });
            // Shift tasks in target column up
            yield task_model_1.default.updateMany({ project: originalTask.project, status: targetStatus, position: { $gte: targetPos } }, { $inc: { position: 1 } });
        }
        else if (originalPos !== targetPos) {
            // Reordering within the same column
            if (targetPos > originalPos) {
                yield task_model_1.default.updateMany({
                    project: originalTask.project,
                    status: sourceStatus,
                    position: { $gt: originalPos, $lte: targetPos },
                }, { $inc: { position: -1 } });
            }
            else {
                yield task_model_1.default.updateMany({
                    project: originalTask.project,
                    status: sourceStatus,
                    position: { $gte: targetPos, $lt: originalPos },
                }, { $inc: { position: 1 } });
            }
        }
        updateData.position = targetPos;
    }
    let updateQuery = { $set: updateData };
    if (newAttachments && newAttachments.length > 0) {
        updateQuery.$push = { attachments: { $each: newAttachments } };
    }
    const updatedTask = yield task_model_1.default.findByIdAndUpdate(taskId, updateQuery, { new: true })
        .populate("assignedTo", "username email")
        .populate("createdBy", "username email");
    if (!updatedTask) {
        throw new Error("Task not found");
    }
    (0, socket_1.emitToProject)(updatedTask.project.toString(), "task:updated", updatedTask);
    const project = yield project_model_1.default.findById(updatedTask.project);
    if (project && updaterId) {
        let action = "task_updated";
        let details = `updated task "${updatedTask.title}"`;
        if (data.status !== undefined && originalTask.status !== data.status) {
            action = "task_status_changed";
            details = `moved task "${updatedTask.title}" from "${originalTask.status}" to "${data.status}"`;
        }
        yield (0, activity_service_1.createActivityLog)({
            workspace: project.workspace.toString(),
            project: project._id.toString(),
            task: updatedTask._id.toString(),
            user: updaterId,
            action,
            details,
        });
    }
    // Notify newly added assignees
    if (data.assignedTo && Array.isArray(data.assignedTo)) {
        const originalAssignees = originalTask.assignedTo ? originalTask.assignedTo.map(id => id.toString()) : [];
        const newAssignees = data.assignedTo.map((id) => id.toString());
        const addedAssignees = newAssignees.filter((id) => !originalAssignees.includes(id));
        for (const assigneeId of addedAssignees) {
            if (assigneeId !== updaterId) {
                yield (0, notification_service_1.createNotification)({
                    recipient: assigneeId,
                    sender: updaterId || updatedTask.createdBy._id.toString(),
                    type: "TASK_ASSIGNED",
                    title: "New Task Assigned",
                    message: `You have been assigned to the task: "${updatedTask.title}"`,
                    link: `/projects/${updatedTask.project}/tasks/${updatedTask._id}`,
                });
            }
        }
    }
    // Notify other task members about general task updates or attachments
    const assigneesList = updatedTask.assignedTo ? updatedTask.assignedTo.map(a => a._id.toString()) : [];
    if (newAttachments && newAttachments.length > 0) {
        const title = "New Attachment on Task";
        const message = `${newAttachments.length} new file(s) uploaded to task "${updatedTask.title}"`;
        const link = `/projects/${updatedTask.project}/tasks/${updatedTask._id}`;
        for (const assigneeId of assigneesList) {
            if (assigneeId !== updaterId) {
                yield (0, notification_service_1.createNotification)({
                    recipient: assigneeId,
                    sender: updaterId || updatedTask.createdBy._id.toString(),
                    type: "TASK_UPDATED",
                    title,
                    message,
                    link,
                });
            }
        }
        if (updatedTask.createdBy &&
            updatedTask.createdBy._id.toString() !== updaterId &&
            !assigneesList.includes(updatedTask.createdBy._id.toString())) {
            yield (0, notification_service_1.createNotification)({
                recipient: updatedTask.createdBy._id.toString(),
                sender: updaterId || updatedTask.createdBy._id.toString(),
                type: "TASK_UPDATED",
                title,
                message,
                link,
            });
        }
    }
    else if (updaterId) {
        for (const assigneeId of assigneesList) {
            if (assigneeId !== updaterId) {
                yield (0, notification_service_1.createNotification)({
                    recipient: assigneeId,
                    sender: updaterId,
                    type: "TASK_UPDATED",
                    title: "Task Updated",
                    message: `The task: "${updatedTask.title}" assigned to you was updated`,
                    link: `/projects/${updatedTask.project}/tasks/${updatedTask._id}`,
                });
            }
        }
    }
    if (data.description !== undefined && data.description !== originalTask.description) {
        yield (0, mention_service_1.parseAndNotifyMentions)(data.description, updaterId || updatedTask.createdBy._id.toString(), updatedTask, false);
    }
    const commentsCount = yield comment_model_1.default.countDocuments({ task: updatedTask._id });
    return Object.assign(Object.assign({}, updatedTask.toObject()), { commentsCount });
});
exports.updateTaskService = updateTaskService;
const deleteTaskService = (taskId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield task_model_1.default.findById(taskId);
    if (task) {
        const positionVal = typeof task.position === "number" ? task.position : 0;
        // Shift subsequent tasks in the same status down
        if (task.project) {
            yield task_model_1.default.updateMany({ project: task.project, status: task.status, position: { $gt: positionVal } }, { $inc: { position: -1 } });
        }
        if (task.project) {
            const project = yield project_model_1.default.findById(task.project);
            if (project && userId && project.workspace) {
                yield (0, activity_service_1.createActivityLog)({
                    workspace: project.workspace.toString(),
                    project: project._id.toString(),
                    task: task._id.toString(),
                    user: userId,
                    action: "task_deleted",
                    details: `deleted task "${task.title}"`,
                });
            }
        }
        task.isDeleted = true;
        task.deletedAt = new Date();
        yield task.save();
        if (task.project) {
            (0, socket_1.emitToProject)(task.project.toString(), "task:deleted", { taskId });
        }
    }
    return task;
});
exports.deleteTaskService = deleteTaskService;
const getArchivedProjectTasksService = (projectId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const project = yield project_model_1.default.findById(projectId);
    const isProjectAdmin = project && (project.createdBy.toString() === userId.toString() ||
        project.members.some(m => m.user.toString() === userId.toString() && m.role === "admin"));
    let query = { project: projectId, isArchived: true, isDeleted: { $ne: true } };
    if (!isProjectAdmin) {
        query.$or = [
            { assignedTo: { $exists: false } },
            { assignedTo: null },
            { assignedTo: { $size: 0 } },
            { assignedTo: userId },
            { createdBy: userId }
        ];
    }
    return yield task_model_1.default.find(query)
        .sort({ updatedAt: -1 })
        .populate("assignedTo", "username email")
        .populate("createdBy", "username email");
});
exports.getArchivedProjectTasksService = getArchivedProjectTasksService;
const logTimeService = (taskId, userId, hours, description, date) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield task_model_1.default.findById(taskId);
    if (!task) {
        throw new Error("Task not found");
    }
    const logDate = date ? new Date(date) : new Date();
    task.timeLogs.push({
        loggedBy: new mongoose_1.default.Types.ObjectId(userId),
        hours,
        description,
        date: logDate,
        createdAt: new Date()
    });
    task.actualHours = task.timeLogs.reduce((sum, log) => sum + log.hours, 0);
    yield task.save();
    const populatedTask = yield task_model_1.default.findById(taskId)
        .populate("assignedTo", "username email")
        .populate("createdBy", "username email")
        .populate("timeLogs.loggedBy", "username email");
    if (populatedTask) {
        (0, socket_1.emitToProject)(populatedTask.project.toString(), "task:updated", populatedTask);
    }
    return populatedTask;
});
exports.logTimeService = logTimeService;
const deleteTimeLogService = (taskId, logId) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield task_model_1.default.findById(taskId);
    if (!task) {
        throw new Error("Task not found");
    }
    task.timeLogs = task.timeLogs.filter((log) => log._id.toString() !== logId);
    task.actualHours = task.timeLogs.reduce((sum, log) => sum + log.hours, 0);
    yield task.save();
    const populatedTask = yield task_model_1.default.findById(taskId)
        .populate("assignedTo", "username email")
        .populate("createdBy", "username email")
        .populate("timeLogs.loggedBy", "username email");
    if (populatedTask) {
        (0, socket_1.emitToProject)(populatedTask.project.toString(), "task:updated", populatedTask);
    }
    return populatedTask;
});
exports.deleteTimeLogService = deleteTimeLogService;
const bulkUpdateTasksService = (taskIds, updateData, updaterId) => __awaiter(void 0, void 0, void 0, function* () {
    const updates = {};
    if (updateData.status !== undefined)
        updates.status = updateData.status;
    if (updateData.priority !== undefined)
        updates.priority = updateData.priority;
    if (updateData.isArchived !== undefined)
        updates.isArchived = updateData.isArchived;
    if (updateData.isDeleted !== undefined) {
        updates.isDeleted = updateData.isDeleted;
        if (updateData.isDeleted)
            updates.deletedAt = new Date();
    }
    if (updateData.assignedTo !== undefined) {
        updates.assignedTo = Array.isArray(updateData.assignedTo)
            ? updateData.assignedTo.map((id) => new mongoose_1.default.Types.ObjectId(id))
            : [];
    }
    const results = yield task_model_1.default.updateMany({ _id: { $in: taskIds } }, { $set: updates });
    const tasks = yield task_model_1.default.find({ _id: { $in: taskIds } })
        .populate("assignedTo", "username email")
        .populate("createdBy", "username email");
    if (tasks.length > 0) {
        const projectId = tasks[0].project.toString();
        (0, socket_1.emitToProject)(projectId, "tasks:bulk-updated", { taskIds, updates });
    }
    return results;
});
exports.bulkUpdateTasksService = bulkUpdateTasksService;
const getTrashTasksService = (projectId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const project = yield project_model_1.default.findById(projectId);
    const isProjectAdmin = project && (project.createdBy.toString() === userId.toString() ||
        project.members.some(m => m.user.toString() === userId.toString() && m.role === "admin"));
    let query = { project: projectId, isDeleted: true };
    if (!isProjectAdmin) {
        query.$or = [
            { assignedTo: { $exists: false } },
            { assignedTo: null },
            { assignedTo: { $size: 0 } },
            { assignedTo: userId },
            { createdBy: userId }
        ];
    }
    return yield task_model_1.default.find(query)
        .sort({ deletedAt: -1 })
        .populate("assignedTo", "username email")
        .populate("createdBy", "username email");
});
exports.getTrashTasksService = getTrashTasksService;
const restoreTaskService = (taskId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield task_model_1.default.findById(taskId);
    if (!task) {
        throw new Error("Task not found");
    }
    task.isDeleted = false;
    task.deletedAt = undefined;
    yield task.save();
    const populatedTask = yield task_model_1.default.findById(taskId)
        .populate("assignedTo", "username email")
        .populate("createdBy", "username email");
    if (populatedTask) {
        (0, socket_1.emitToProject)(populatedTask.project.toString(), "task:created", populatedTask);
    }
    return populatedTask;
});
exports.restoreTaskService = restoreTaskService;
const deleteTaskPermanentlyService = (taskId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield task_model_1.default.findById(taskId);
    if (!task) {
        throw new Error("Task not found");
    }
    yield task_model_1.default.findByIdAndDelete(taskId);
    (0, socket_1.emitToProject)(task.project.toString(), "task:deleted", { taskId });
    return task;
});
exports.deleteTaskPermanentlyService = deleteTaskPermanentlyService;
