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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTaskPermanentlyController = exports.restoreTaskController = exports.getTrashTasksController = exports.bulkUpdateController = exports.deleteTimeLogController = exports.logTimeController = exports.deleteTaskController = exports.updateTaskController = exports.getSingleTaskController = exports.getArchivedProjectTasksController = exports.getProjectTasksController = exports.createTaskController = void 0;
const task_service_1 = require("../services/task.service");
const createTaskController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const task = yield (0, task_service_1.createTaskService)(Object.assign(Object.assign({}, req.body), { createdBy: userId }));
        return res.status(201).json({
            success: true,
            task,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to create task",
        });
    }
});
exports.createTaskController = createTaskController;
const getProjectTasksController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectId = req.params.projectId;
        const userId = req.user._id;
        const tasks = yield (0, task_service_1.getProjectTasksService)(projectId, userId);
        return res.status(200).json({
            success: true,
            tasks,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch tasks",
        });
    }
});
exports.getProjectTasksController = getProjectTasksController;
const getArchivedProjectTasksController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectId = req.params.projectId;
        const userId = req.user._id;
        const tasks = yield (0, task_service_1.getArchivedProjectTasksService)(projectId, userId);
        return res.status(200).json({
            success: true,
            tasks,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch archived tasks",
        });
    }
});
exports.getArchivedProjectTasksController = getArchivedProjectTasksController;
const getSingleTaskController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskId = req.params.taskId;
        const userId = req.user._id;
        const task = yield (0, task_service_1.getSingleTaskService)(taskId, userId);
        return res.status(200).json({
            success: true,
            task,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch task",
        });
    }
});
exports.getSingleTaskController = getSingleTaskController;
const updateTaskController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { taskId } = req.params;
        const userId = req.user._id;
        const updatedTask = yield (0, task_service_1.updateTaskService)(taskId, req.body, userId);
        return res.status(200).json({
            success: true,
            updatedTask,
            task: updatedTask,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to update task",
        });
    }
});
exports.updateTaskController = updateTaskController;
const deleteTaskController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskId = req.params.taskId;
        const userId = req.user._id;
        yield (0, task_service_1.deleteTaskService)(taskId, userId);
        return res.status(200).json({
            success: true,
            message: "Task deleted",
        });
    }
    catch (error) {
        console.error("deleteTaskController error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete task",
        });
    }
});
exports.deleteTaskController = deleteTaskController;
const logTimeController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskId = req.params.taskId;
        const userId = req.user._id;
        const { hours, description, date } = req.body;
        if (!hours || isNaN(Number(hours))) {
            return res.status(400).json({ success: false, message: "Valid hours are required" });
        }
        const task = yield (0, task_service_1.logTimeService)(taskId, userId, Number(hours), description, date);
        return res.status(200).json({ success: true, task });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Failed to log time" });
    }
});
exports.logTimeController = logTimeController;
const deleteTimeLogController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskId = req.params.taskId;
        const logId = req.params.logId;
        const task = yield (0, task_service_1.deleteTimeLogService)(taskId, logId);
        return res.status(200).json({ success: true, task });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Failed to delete time log" });
    }
});
exports.deleteTimeLogController = deleteTimeLogController;
const bulkUpdateController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { taskIds, updates } = req.body;
        const userId = req.user._id;
        if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
            return res.status(400).json({ success: false, message: "taskIds array is required" });
        }
        yield (0, task_service_1.bulkUpdateTasksService)(taskIds, updates, userId);
        return res.status(200).json({ success: true, message: "Tasks updated successfully" });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Failed to bulk update tasks" });
    }
});
exports.bulkUpdateController = bulkUpdateController;
const getTrashTasksController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectId = req.params.projectId;
        const userId = req.user._id;
        const tasks = yield (0, task_service_1.getTrashTasksService)(projectId, userId);
        return res.status(200).json({ success: true, tasks });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Failed to fetch trash tasks" });
    }
});
exports.getTrashTasksController = getTrashTasksController;
const restoreTaskController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskId = req.params.taskId;
        const userId = req.user._id;
        const task = yield (0, task_service_1.restoreTaskService)(taskId, userId);
        return res.status(200).json({ success: true, task });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Failed to restore task" });
    }
});
exports.restoreTaskController = restoreTaskController;
const deleteTaskPermanentlyController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskId = req.params.taskId;
        const userId = req.user._id;
        yield (0, task_service_1.deleteTaskPermanentlyService)(taskId, userId);
        return res.status(200).json({ success: true, message: "Task permanently deleted" });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Failed to permanently delete task" });
    }
});
exports.deleteTaskPermanentlyController = deleteTaskPermanentlyController;
