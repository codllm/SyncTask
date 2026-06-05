import { Request, Response } from "express";
import mongoose from "mongoose";
import TaskModel from "../model/task.model";

export const getProjectAnalyticsController = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    // Use aggregate to count tasks by status for the graphs
    const analytics = await TaskModel.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(projectId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Format into a predictable object: { todo: 0, "in-progress": 0, completed: 0 }
    const result = {
      todo: 0,
      "in-progress": 0,
      completed: 0,
    };

    analytics.forEach((item) => {
      if (item._id === "todo" || item._id === "in-progress" || item._id === "completed") {
        result[item._id] = item.count;
      }
    });

    res.status(200).json({
      success: true,
      analytics: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
