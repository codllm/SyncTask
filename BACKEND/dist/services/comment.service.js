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
exports.deleteCommentService = exports.toggleCommentReactionService = exports.updateCommentService = exports.getTaskCommentsService = exports.createCommentService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const comment_model_1 = __importDefault(require("../model/comment.model"));
const task_model_1 = __importDefault(require("../model/task.model"));
const project_model_1 = __importDefault(require("../model/project.model"));
const notification_service_1 = require("./notification.service");
const socket_1 = require("./socket");
const activity_service_1 = require("./activity.service");
const mention_service_1 = require("./mention.service");
const createCommentService = (content, taskId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const comment = yield comment_model_1.default.create({
        content,
        task: taskId,
        user: userId,
    });
    const populatedComment = yield comment_model_1.default.findById(comment._id)
        .populate("user", "username email")
        .populate("reactions.user", "username email");
    if (!populatedComment) {
        throw new Error("Failed to populate created comment");
    }
    const task = yield task_model_1.default.findById(taskId);
    if (task) {
        const title = "New Comment on Task";
        const message = `A comment was added to task "${task.title}"`;
        const link = `/projects/${task.project}/tasks/${task._id}`;
        (0, socket_1.emitToProject)(task.project.toString(), "comment:created", populatedComment);
        const project = yield project_model_1.default.findById(task.project);
        if (project) {
            yield (0, activity_service_1.createActivityLog)({
                workspace: project.workspace.toString(),
                project: project._id.toString(),
                task: task._id.toString(),
                user: userId,
                action: "comment_added",
                details: `commented on task "${task.title}": "${content.substring(0, 30)}${content.length > 30 ? "..." : ""}"`,
            });
        }
        // Call mentions service
        yield (0, mention_service_1.parseAndNotifyMentions)(content, userId, task, true);
        const assigneesList = task.assignedTo ? task.assignedTo.map(a => a.toString()) : [];
        for (const assigneeId of assigneesList) {
            if (assigneeId !== userId.toString()) {
                yield (0, notification_service_1.createNotification)({
                    recipient: assigneeId,
                    sender: userId,
                    type: "COMMENT_ADDED",
                    title,
                    message,
                    link,
                });
            }
        }
        if (task.createdBy &&
            task.createdBy.toString() !== userId.toString() &&
            !assigneesList.includes(task.createdBy.toString())) {
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
    const comments = yield comment_model_1.default.find({
        task: taskId,
    })
        .populate("user", "username email")
        .populate("reactions.user", "username email")
        .sort({ createdAt: -1 });
    return comments;
});
exports.getTaskCommentsService = getTaskCommentsService;
const updateCommentService = (commentId, content, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const comment = yield comment_model_1.default.findById(commentId).populate("task");
    if (!comment) {
        throw new Error("Comment not found");
    }
    if (comment.user.toString() !== userId.toString()) {
        throw new Error("Unauthorized: Only the author can edit this comment");
    }
    comment.content = content;
    yield comment.save();
    const populatedComment = yield comment_model_1.default.findById(commentId)
        .populate("user", "username email")
        .populate("reactions.user", "username email");
    if (comment.task) {
        (0, socket_1.emitToProject)(comment.task.project.toString(), "comment:updated", populatedComment);
    }
    return populatedComment;
});
exports.updateCommentService = updateCommentService;
const toggleCommentReactionService = (commentId, emoji, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const comment = yield comment_model_1.default.findById(commentId).populate("task");
    if (!comment) {
        throw new Error("Comment not found");
    }
    const existingReactionIndex = comment.reactions.findIndex((r) => r.user.toString() === userId.toString() && r.emoji === emoji);
    if (existingReactionIndex > -1) {
        comment.reactions.splice(existingReactionIndex, 1);
    }
    else {
        comment.reactions.push({ user: new mongoose_1.default.Types.ObjectId(userId), emoji });
    }
    yield comment.save();
    const populatedComment = yield comment_model_1.default.findById(commentId)
        .populate("user", "username email")
        .populate("reactions.user", "username email");
    if (comment.task) {
        (0, socket_1.emitToProject)(comment.task.project.toString(), "comment:updated", populatedComment);
    }
    return populatedComment;
});
exports.toggleCommentReactionService = toggleCommentReactionService;
const deleteCommentService = (commentId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const comment = yield comment_model_1.default.findById(commentId).populate("task");
    if (!comment) {
        throw new Error("Comment not found");
    }
    if (comment.user.toString() !== userId.toString()) {
        throw new Error("Unauthorized: Only the author can delete this comment");
    }
    yield comment_model_1.default.findByIdAndDelete(commentId);
    if (comment.task) {
        (0, socket_1.emitToProject)(comment.task.project.toString(), "comment:deleted", { commentId });
    }
    return comment;
});
exports.deleteCommentService = deleteCommentService;
