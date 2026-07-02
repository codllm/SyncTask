import { Request, Response } from "express";
import { generateTaskDraft, generateTaskSummary, rewriteComment } from "../services/ai.service";

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

export const generateTaskSummaryController = async (req: Request, res: Response) => {
  try {
    const { title, description, status, priority, labels, subtasks, comments } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required",
      });
    }

    const summary = await generateTaskSummary({
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
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to summarize task",
    });
  }
};

export const rewriteCommentController = async (req: Request, res: Response) => {
  try {
    const { content, taskTitle } = req.body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
    }

    const rewritten = await rewriteComment({
      content: content.trim(),
      taskTitle,
    });

    return res.status(200).json({
      success: true,
      content: rewritten.content,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to rewrite comment",
    });
  }
};
