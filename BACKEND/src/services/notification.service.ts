import Notification, { INotification } from "../model/notification.model";
import { emitToUser } from "./socket";
import { sendPushNotification } from "./push.service";
import mongoose from "mongoose";
import Workspace from "../model/workspace.model";

interface CreateNotificationPayload {
  recipient: string | mongoose.Types.ObjectId;
  sender?: string | mongoose.Types.ObjectId;
  type:
    | "TASK_ASSIGNED"
    | "TASK_UPDATED"
    | "PROJECT_ADDED"
    | "PROJECT_MEMBER_ADDED"
    | "WORKSPACE_INVITE"
    | "WORKSPACE_INVITE_SENT"
    | "WORKSPACE_INVITE_ACCEPTED"
    | "WORKSPACE_INVITE_DECLINED"
    | "COMMENT_ADDED";
  title: string;
  message: string;
  link?: string;
  workspace?: string | mongoose.Types.ObjectId;
  inviteStatus?: "pending" | "accepted" | "declined";
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
    .populate("sender", "username email")
    .populate("workspace", "name logoUrl");

  // Emit a real-time socket event directly to the recipient's room
  emitToUser(
    payload.recipient.toString(),
    "notification:received",
    populatedNotification
  );

  // Send background remote push notification
  sendPushNotification(
    payload.recipient.toString(),
    payload.title,
    payload.message,
    { notificationId: notification._id.toString() }
  );

  return notification;
};

export const notifyWorkspaceManagers = async (
  workspaceId: string | mongoose.Types.ObjectId,
  senderId: string | mongoose.Types.ObjectId,
  payload: Omit<CreateNotificationPayload, "recipient" | "sender" | "workspace">
) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) return;

  const sender = senderId.toString();
  const managerIds = new Set<string>();

  managerIds.add(workspace.owner.toString());
  for (const member of workspace.members) {
    if (member.status === "joined" && ["owner", "admin"].includes(member.role)) {
      managerIds.add(member.user.toString());
    }
  }

  managerIds.delete(sender);

  await Promise.all(
    Array.from(managerIds).map((recipient) =>
      createNotification({
        ...payload,
        recipient,
        sender,
        workspace: workspace._id,
      })
    )
  );
};

/**
 * Fetch latest notifications for a specific user
 */
export const getUserNotifications = async (
  userId: string,
  limit: number = 15,
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
    .populate("workspace", "name logoUrl")
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
  ).populate("sender", "username email").populate("workspace", "name logoUrl");

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

/**
 * Accept workspace invite by notification ID
 */
export const acceptWorkspaceInvite = async (
  notificationId: string,
  userId: string
): Promise<INotification> => {
  const notification = await Notification.findOne({ _id: notificationId, recipient: userId });
  if (!notification) {
    throw new Error("Notification not found or unauthorized");
  }
  if (notification.type !== "WORKSPACE_INVITE") {
    throw new Error("Invalid notification type");
  }

  const workspaceId = notification.workspace || notification.link?.split("/").pop();
  if (!workspaceId) {
    throw new Error("Workspace ID not found in notification");
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new Error("Workspace not found");
  }

  let member = workspace.members.find((m) => m.user.toString() === userId);

  if (member?.status === "joined") {
    throw new Error("You have already joined this workspace");
  }

  if (member) {
    member.status = "joined";
  } else {
    workspace.members.push({
      user: new mongoose.Types.ObjectId(userId),
      role: "member",
      status: "joined",
    });
  }

  await workspace.save();

  notification.inviteStatus = "accepted";
  notification.read = true;
  await notification.save();

  const populated = await Notification.findById(notification._id)
    .populate("sender", "username email")
    .populate("workspace", "name logoUrl");

  if (populated) {
    emitToUser(userId, "notification:updated", populated);
    await notifyWorkspaceManagers(workspace._id, userId, {
      type: "WORKSPACE_INVITE_ACCEPTED",
      title: "Workspace Invite Accepted",
      message: `A user accepted the invitation to join "${workspace.name}"`,
      link: `/workspaces/${workspace._id}`,
    });
    return populated;
  }

  await notifyWorkspaceManagers(workspace._id, userId, {
    type: "WORKSPACE_INVITE_ACCEPTED",
    title: "Workspace Invite Accepted",
    message: `A user accepted the invitation to join "${workspace.name}"`,
    link: `/workspaces/${workspace._id}`,
  });

  return notification;
};

/**
 * Decline workspace invite by notification ID
 */
export const declineWorkspaceInvite = async (
  notificationId: string,
  userId: string
): Promise<INotification> => {
  const notification = await Notification.findOne({ _id: notificationId, recipient: userId });
  if (!notification) {
    throw new Error("Notification not found or unauthorized");
  }
  if (notification.type !== "WORKSPACE_INVITE") {
    throw new Error("Invalid notification type");
  }

  const workspaceId = notification.workspace || notification.link?.split("/").pop();
  if (!workspaceId) {
    throw new Error("Workspace ID not found in notification");
  }

  const workspace = await Workspace.findById(workspaceId);
  if (workspace) {
    workspace.members = workspace.members.filter(
      (m) => m.user.toString() !== userId
    );
    await workspace.save();
  }

  notification.inviteStatus = "declined";
  notification.read = true;
  await notification.save();

  const populated = await Notification.findById(notification._id)
    .populate("sender", "username email")
    .populate("workspace", "name logoUrl");

  if (populated) {
    emitToUser(userId, "notification:updated", populated);
    await notifyWorkspaceManagers(workspaceId, userId, {
      type: "WORKSPACE_INVITE_DECLINED",
      title: "Workspace Invite Declined",
      message: "A user declined a workspace invitation",
      link: `/workspaces/${workspaceId}`,
    });
    return populated;
  }

  await notifyWorkspaceManagers(workspaceId, userId, {
    type: "WORKSPACE_INVITE_DECLINED",
    title: "Workspace Invite Declined",
    message: "A user declined a workspace invitation",
    link: `/workspaces/${workspaceId}`,
  });

  return notification;
};
