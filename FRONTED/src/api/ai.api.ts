import api from "./user.api";

export interface TaskDraft {
  title: string;
  description: string;
  checklist: string[];
  labels: string[];
  priority: "low" | "medium" | "high";
  estimatedHours: number;
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
