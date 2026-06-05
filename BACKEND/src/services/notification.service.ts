import Notification, { INotification } from "../model/notification.model";
import { emitToUser } from "./socket";
import mongoose from "mongoose";

interface CreateNotificationPayload {
  recipient: string | mongoose.Types.ObjectId;
  sender?: string | mongoose.Types.ObjectId;
  type: "TASK_ASSIGNED" | "TASK_UPDATED" | "PROJECT_ADDED" | "WORKSPACE_INVITE" | "COMMENT_ADDED";
  title: string;
  message: string;
  link?: string;
}

/**
 * Create a new notification, save to DB, and emit to Socket.io user room
 */
export const createNotification = async (
  payload: CreateNotificationPayload
): Promise<INotification> => {
  const notification = await Notification.create(payload);
  
  // Populate sender details for the socket event
  const populatedNotification = await Notification.findById(notification._id)
    .populate("sender", "username email");

  // Emit a real-time socket event directly to the recipient's room
  emitToUser(
    payload.recipient.toString(),
    "notification:received",
    populatedNotification
  );

  return notification;
};

/**
 * Fetch latest notifications for a specific user
 */
export const getUserNotifications = async (
  userId: string,
  limit: number = 20,
  page: number = 1,
  type?: string
): Promise<{ notifications: INotification[]; unreadCount: number }> => {
  const skip = (page - 1) * limit;

  const query: any = { recipient: userId };
  if (type) {
    query.type = type;
  }

  const notifications = await Notification.find(query)
    .populate("sender", "username email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const unreadCount = await Notification.countDocuments({
    ...query,
    read: false,
  });

  return { notifications, unreadCount };
};

/**
 * Mark a specific notification as read
 */
export const markNotificationAsRead = async (
  notificationId: string,
  userId: string
): Promise<INotification> => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { $set: { read: true } },
    { new: true }
  ).populate("sender", "username email");

  if (!notification) {
    throw new Error("Notification not found or unauthorized");
  }

  // Notify the client about read state change
  emitToUser(userId, "notification:updated", notification);

  return notification;
};

/**
 * Mark all notifications for a user as read
 */
export const markAllNotificationsAsRead = async (
  userId: string
): Promise<{ success: boolean; modifiedCount: number }> => {
  const result = await Notification.updateMany(
    { recipient: userId, read: false },
    { $set: { read: true } }
  );

  // Notify client to clear local unread count
  emitToUser(userId, "notifications:read-all", { userId });

  return { success: true, modifiedCount: result.modifiedCount };
};
