import mongoose, { Schema, Document } from "mongoose";

export interface ITodo extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  status: "todo" | "completed";
  priority: "low" | "medium" | "high";
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const todoSchema = new Schema<ITodo>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["todo", "completed"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITodo>("Todo", todoSchema);
