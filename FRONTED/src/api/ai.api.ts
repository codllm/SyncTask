import api from "./user.api";

export interface TaskDraft {
  title: string;
  description: string;
  checklist: string[];
  labels: string[];
  priority: "low" | "medium" | "high";
  estimatedHours: number;
}

export interface TaskSummary {
  summary: string;
  nextSteps: string[];
  blockers: string[];
}

export const generateTaskDraft = async (payload: {
  title: string;
  projectName?: string;
  workspaceName?: string;
  existingTasks?: string[];
}): Promise<{ success: boolean; draft: TaskDraft }> => {
  const res = await api.post("/api/ai/task-draft", payload);
  return res.data;
};

export const generateTaskSummary = async (payload: {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  labels?: string[];
  subtasks?: { title: string; isCompleted?: boolean }[];
  comments?: string[];
}): Promise<{ success: boolean; summary: TaskSummary }> => {
  const res = await api.post("/api/ai/task-summary", payload);
  return res.data;
};

export const rewriteComment = async (payload: {
  content: string;
  taskTitle?: string;
}): Promise<{ success: boolean; content: string }> => {
  const res = await api.post("/api/ai/comment-rewrite", payload);
  return res.data;
};
