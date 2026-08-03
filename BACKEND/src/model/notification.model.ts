import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId;
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
  read: boolean;
  link?: string;
  workspace?: mongoose.Types.ObjectId;
  inviteStatus?: "pending" | "accepted" | "declined";
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        "TASK_ASSIGNED",
        "TASK_UPDATED",
        "PROJECT_ADDED",
        "PROJECT_MEMBER_ADDED",
        "WORKSPACE_INVITE",
        "WORKSPACE_INVITE_SENT",
        "WORKSPACE_INVITE_ACCEPTED",
        "WORKSPACE_INVITE_DECLINED",
        "COMMENT_ADDED",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
      required: true,
    },
    link: {
      type: String,
      trim: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
    },
    inviteStatus: {
      type: String,
      enum: ["pending", "accepted", "declined"],
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model<INotification>("Notification", notificationSchema);

export default Notification;
