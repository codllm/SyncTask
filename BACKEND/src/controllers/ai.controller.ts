import { Request, Response } from "express";
import { generateTaskDraft } from "../services/ai.service";

export const generateTaskDraftController = async (req: Request, res: Response) => {
  try {
    const { title, projectName, workspaceName, existingTasks } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required",
      });
    }

    const draft = await generateTaskDraft({
      title: title.trim(),
      projectName,
      workspaceName,
      existingTasks: Array.isArray(existingTasks) ? existingTasks : [],
    });

    return res.status(200).json({
      success: true,
      draft,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate task draft",
    });
  }
};
