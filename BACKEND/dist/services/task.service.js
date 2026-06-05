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
exports.deleteTaskService = exports.updateTaskService = exports.getSingleTaskService = exports.getProjectTasksService = exports.createTaskService = void 0;
const task_model_1 = __importDefault(require("../model/task.model"));
const notification_service_1 = require("./notification.service");
const socket_1 = require("./socket");
const createTaskService = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield task_model_1.default.create(data);
    const populatedTask = yield task_model_1.default.findById(task._id)
        .populate("assignedTo", "username email")
        .populate("createdBy", "username email");
    if (!populatedTask) {
        throw new Error("Failed to populate created task");
    }
    // Emit real-time event to project room
    (0, socket_1.emitToProject)(populatedTask.project.toString(), "task:created", populatedTask);
    // If task is assigned to someone else, trigger a notification
    if (populatedTask.assignedTo &&
        populatedTask.assignedTo._id.toString() !== populatedTask.createdBy._id.toString()) {
        yield (0, notification_service_1.createNotification)({
            recipient: populatedTask.assignedTo._id.toString(),
            sender: populatedTask.createdBy._id.toString(),
            type: "TASK_ASSIGNED",
            title: "New Task Assigned",
            message: `You have been assigned to the task: "${populatedTask.title}"`,
            link: `/projects/${populatedTask.project}/tasks/${populatedTask._id}`,
        });
    }
    return populatedTask;
});
exports.createTaskService = createTaskService;
const getProjectTasksService = (projectId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield task_model_1.default.find({
        project: projectId,
    })
        .populate("assignedTo", "username email")
        .populate("createdBy", "username email");
});
exports.getProjectTasksService = getProjectTasksService;
const getSingleTaskService = (taskId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield task_model_1.default.findById(taskId)
        .populate("assignedTo", "username email")
        .populate("createdBy", "username email");
});
exports.getSingleTaskService = getSingleTaskService;
const updateTaskService = (taskId, data, updaterId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const originalTask = yield task_model_1.default.findById(taskId);
    if (!originalTask) {
        throw new Error("Task not found");
    }
    const updatedTask = yield task_model_1.default.findByIdAndUpdate(taskId, data, { new: true })
        .populate("assignedTo", "username email")
        .populate("createdBy", "username email");
    if (!updatedTask) {
        throw new Error("Task not found");
    }
    // Emit real-time board update to project room
    (0, socket_1.emitToProject)(updatedTask.project.toString(), "task:updated", updatedTask);
    // Trigger notification if assignee has changed
    if (data.assignedTo &&
        (!originalTask.assignedTo || originalTask.assignedTo.toString() !== data.assignedTo.toString())) {
        yield (0, notification_service_1.createNotification)({
            recipient: data.assignedTo,
            sender: updaterId || updatedTask.createdBy._id.toString(),
            type: "TASK_ASSIGNED",
            title: "New Task Assigned",
            message: `You have been assigned to the task: "${updatedTask.title}"`,
            link: `/projects/${updatedTask.project}/tasks/${updatedTask._id}`,
        });
    }
    else if (originalTask.assignedTo &&
        originalTask.assignedTo.toString() !== updaterId &&
        originalTask.assignedTo.toString() === ((_b = (_a = updatedTask.assignedTo) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString())) {
        // Notify the assignee that their task was updated by someone else
        yield (0, notification_service_1.createNotification)({
            recipient: originalTask.assignedTo.toString(),
            sender: updaterId || updatedTask.createdBy._id.toString(),
            type: "TASK_UPDATED",
            title: "Task Updated",
            message: `The task: "${updatedTask.title}" assigned to you was updated`,
            link: `/projects/${updatedTask.project}/tasks/${updatedTask._id}`,
        });
    }
    return updatedTask;
});
exports.updateTaskService = updateTaskService;
const deleteTaskService = (taskId) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield task_model_1.default.findById(taskId);
    if (!task) {
        throw new Error("Task not found");
    }
    yield task_model_1.default.findByIdAndDelete(taskId);
    // Emit real-time delete event to project room
    (0, socket_1.emitToProject)(task.project.toString(), "task:deleted", { taskId });
    return task;
});
exports.deleteTaskService = deleteTaskService;
