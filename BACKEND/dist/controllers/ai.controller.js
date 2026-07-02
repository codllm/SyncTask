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
exports.rewriteCommentController = exports.generateTaskSummaryController = exports.generateTaskDraftController = void 0;
const ai_service_1 = require("../services/ai.service");
const generateTaskDraftController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, projectName, workspaceName, existingTasks } = req.body;
        if (!title || typeof title !== "string" || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Task title is required",
            });
        }
        const draft = yield (0, ai_service_1.generateTaskDraft)({
            title: title.trim(),
            projectName,
            workspaceName,
            existingTasks: Array.isArray(existingTasks) ? existingTasks : [],
        });
        return res.status(200).json({
            success: true,
            draft,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to generate task draft",
        });
    }
});
exports.generateTaskDraftController = generateTaskDraftController;
const generateTaskSummaryController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, status, priority, labels, subtasks, comments } = req.body;
        if (!title || typeof title !== "string" || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Task title is required",
            });
        }
        const summary = yield (0, ai_service_1.generateTaskSummary)({
            title: title.trim(),
            description,
            status,
            priority,
            labels: Array.isArray(labels) ? labels : [],
            subtasks: Array.isArray(subtasks) ? subtasks : [],
            comments: Array.isArray(comments) ? comments : [],
        });
        return res.status(200).json({
            success: true,
            summary,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to summarize task",
        });
    }
});
exports.generateTaskSummaryController = generateTaskSummaryController;
const rewriteCommentController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content, taskTitle } = req.body;
        if (!content || typeof content !== "string" || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Comment content is required",
            });
        }
        const rewritten = yield (0, ai_service_1.rewriteComment)({
            content: content.trim(),
            taskTitle,
        });
        return res.status(200).json({
            success: true,
            content: rewritten.content,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to rewrite comment",
        });
    }
});
exports.rewriteCommentController = rewriteCommentController;
