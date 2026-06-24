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
exports.sendPushNotification = void 0;
const expo_server_sdk_1 = require("expo-server-sdk");
const user_model_1 = __importDefault(require("../model/user.model"));
// Create a new Expo SDK client
const expo = new expo_server_sdk_1.Expo();
/**
 * Send a push notification to all registered tokens of a recipient user
 */
const sendPushNotification = (recipientId, title, body, data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.default.findById(recipientId);
        if (!user || !user.pushTokens || user.pushTokens.length === 0) {
            console.log(`PushService: User ${recipientId} has no registered push tokens.`);
            return;
        }
        console.log(`PushService: Sending push notification to user ${recipientId} on ${user.pushTokens.length} token(s)`);
        const messages = [];
        for (const pushToken of user.pushTokens) {
            // Validate that this is a correct Expo push token
            if (!expo_server_sdk_1.Expo.isExpoPushToken(pushToken)) {
                console.error(`PushToken ${pushToken} is not a valid Expo push token`);
                continue;
            }
            messages.push({
                to: pushToken,
                sound: "default",
                title: title,
                body: body,
                data: data || {},
            });
        }
        if (messages.length === 0)
            return;
        // Chunk the push notifications to comply with Expo guidelines
        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];
        for (const chunk of chunks) {
            try {
                const ticketChunk = yield expo.sendPushNotificationsAsync(chunk);
                console.log("PushService: Sent chunk of push notifications successfully");
                tickets.push(...ticketChunk);
            }
            catch (error) {
                console.error("PushService: Error sending notification chunk:", error);
            }
        }
    }
    catch (error) {
        console.error("PushService: Failed to send push notification:", error);
    }
});
exports.sendPushNotification = sendPushNotification;
