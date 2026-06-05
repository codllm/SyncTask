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
exports.deleteCommentService = exports.getTaskCommentsService = exports.createCommentService = void 0;
const comment_model_1 = __importDefault(require("../model/comment.model"));
const task_model_1 = __importDefault(require("../model/task.model"));
const notification_service_1 = require("./notification.service");
const socket_1 = require("./socket");
const createCommentService = (content, taskId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const comment = yield comment_model_1.default.create({
        content,
        task: taskId,
        user: userId,
    });
    const populatedComment = yield comment_model_1.default.findById(comment._id)
        .populate("user", "username email");
    if (!populatedComment) {
        throw new Error("Failed to populate created comment");
    }
    const task = yield task_model_1.default.findById(taskId);
    if (task) {
        const title = "New Comment on Task";
        const message = `A comment was added to task "${task.title}"`;
        const link = `/projects/${task.project}/tasks/${task._id}`;
        // Emit Socket.io real-time update to project room
        (0, socket_1.emitToProject)(task.project.toString(), "comment:created", populatedComment);
        // Notify assignee if not the commenter
        if (task.assignedTo && task.assignedTo.toString() !== userId.toString()) {
            yield (0, notification_service_1.createNotification)({
                recipient: task.assignedTo.toString(),
                sender: userId,
                type: "COMMENT_ADDED",
                title,
                message,
                link,
            });
        }
        // Notify creator if not the commenter and not the assignee
        if (task.createdBy &&
            task.createdBy.toString() !== userId.toString() &&
            (!task.assignedTo || task.assignedTo.toString() !== task.createdBy.toString())) {
            yield (0, notification_service_1.createNotification)({
                recipient: task.createdBy.toString(),
                sender: userId,
                type: "COMMENT_ADDED",
                title,
                message,
                link,
            });
        }
    }
    return populatedComment;
});
exports.createCommentService = createCommentService;
const getTaskCommentsService = (taskId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield comment_model_1.default.find({
        task: taskId,
    })
        .populate("user", "username email")
        .sort({ createdAt: -1 });
});
exports.getTaskCommentsService = getTaskCommentsService;
const deleteCommentService = (commentId) => __awaiter(void 0, void 0, void 0, function* () {
    const comment = yield comment_model_1.default.findById(commentId).populate("task");
    if (!comment) {
        throw new Error("Comment not found");
    }
    yield comment_model_1.default.findByIdAndDelete(commentId);
    // Emit a real-time event to the project board
    if (comment.task) {
        (0, socket_1.emitToProject)(comment.task.project.toString(), "comment:deleted", { commentId });
    }
    return comment;
});
exports.deleteCommentService = deleteCommentService;
