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
exports.parseAndNotifyMentions = void 0;
const user_model_1 = __importDefault(require("../model/user.model"));
const notification_service_1 = require("./notification.service");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Parse text for @name mentions, find matching users,
 * and create notifications if their preferences allow.
 */
const parseAndNotifyMentions = (text_1, senderId_1, task_1, ...args_1) => __awaiter(void 0, [text_1, senderId_1, task_1, ...args_1], void 0, function* (text, senderId, task, isComment = false) {
    try {
        if (!text)
            return;
        // Matches @Name or @NameName (word characters)
        const matches = [...text.matchAll(/@(\w+)/g)].map((m) => m[1]);
        if (matches.length === 0)
            return;
        // Unique names
        const uniqueNames = Array.from(new Set(matches));
        for (const name of uniqueNames) {
            const queryOr = [
                { "username.firstname": { $regex: new RegExp("^" + name + "$", "i") } },
                { "username.lastname": { $regex: new RegExp("^" + name + "$", "i") } },
            ];
            if (name.includes("_")) {
                const parts = name.split("_");
                if (parts.length === 2) {
                    queryOr.push({
                        $and: [
                            { "username.firstname": { $regex: new RegExp("^" + parts[0] + "$", "i") } },
                            { "username.lastname": { $regex: new RegExp("^" + parts[1] + "$", "i") } },
                        ],
                    });
                }
            }
            const user = yield user_model_1.default.findOne({ $or: queryOr });
            if (!user)
                continue;
            const userId = user._id.toString();
            // Don't notify self
            if (userId === senderId.toString())
                continue;
            // Check notification preferences
            const preferences = user.notificationPreferences;
            if (preferences && preferences.mentions === false) {
                continue;
            }
            // Fetch sender details
            const sender = yield user_model_1.default.findById(senderId);
            const senderName = sender
                ? `${sender.username.firstname} ${sender.username.lastname}`
                : "Someone";
            yield (0, notification_service_1.createNotification)({
                recipient: user._id,
                sender: new mongoose_1.default.Types.ObjectId(senderId),
                type: "TASK_UPDATED",
                title: "You were mentioned",
                message: isComment
                    ? `${senderName} mentioned you in a comment on task "${task.title}".`
                    : `${senderName} mentioned you in the task: "${task.title}".`,
                link: `/projects/${task.project}/tasks/${task._id}`,
            });
        }
    }
    catch (error) {
        console.error("Error parsing and notifying mentions:", error);
    }
});
exports.parseAndNotifyMentions = parseAndNotifyMentions;
