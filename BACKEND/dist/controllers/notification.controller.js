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
exports.markAllReadController = exports.markReadController = exports.getNotificationsController = void 0;
const notification_service_1 = require("../services/notification.service");
const getNotificationsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const result = yield (0, notification_service_1.getUserNotifications)(userId.toString(), limit, page);
        return res.status(200).json(Object.assign({ success: true }, result));
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve notifications",
        });
    }
});
exports.getNotificationsController = getNotificationsController;
const markReadController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const notificationId = String(req.params.notificationId);
        const notification = yield (0, notification_service_1.markNotificationAsRead)(notificationId, userId.toString());
        return res.status(200).json({
            success: true,
            notification,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to mark notification as read",
        });
    }
});
exports.markReadController = markReadController;
const markAllReadController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const result = yield (0, notification_service_1.markAllNotificationsAsRead)(userId.toString());
        return res.status(200).json({
            success: true,
            modifiedCount: result.modifiedCount,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to mark all notifications as read",
        });
    }
});
exports.markAllReadController = markAllReadController;
