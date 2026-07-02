import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

type TaskDraftInput = {
  title: string;
  projectName?: string;
  workspaceName?: string;
  existingTasks?: string[];
};

type TaskSummaryInput = {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  labels?: string[];
  subtasks?: { title: string; isCompleted?: boolean }[];
  comments?: string[];
};

type CommentRewriteInput = {
  content: string;
  taskTitle?: string;
};

export type TaskDraftResult = {
  title: string;
  description: string;
  checklist: string[];
  labels: string[];
  priority: "low" | "medium" | "high";
  estimatedHours: number;
};

export type TaskSummaryResult = {
  summary: string;
  nextSteps: string[];
  blockers: string[];
};

export type CommentRewriteResult = {
  content: string;
};

const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || "meta/llama-3.1-70b-instruct";

const fallbackDraft = (input: TaskDraftInput): TaskDraftResult => {
  const cleanTitle = input.title.trim();
  return {
    title: cleanTitle,
    description: `Plan and complete "${cleanTitle}". Define scope, confirm requirements, implement the work, test the result, and document any follow-up decisions.`,
    checklist: [
      "Clarify expected outcome",
      "Break work into implementation steps",
      "Complete the core work",
      "Test and verify the result",
    ],
    labels: ["Planning"],
    priority: "medium",
    estimatedHours: 3,
  };
};

const parseDraft = (content: string, input: TaskDraftInput): TaskDraftResult => {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);

    return {
      title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : input.title.trim(),
      description:
        typeof parsed.description === "string" && parsed.description.trim()
          ? parsed.description.trim()
          : fallbackDraft(input).description,
      checklist: Array.isArray(parsed.checklist)
        ? parsed.checklist.filter((item: unknown) => typeof item === "string" && item.trim()).slice(0, 6)
        : fallbackDraft(input).checklist,
      labels: Array.isArray(parsed.labels)
        ? parsed.labels.filter((item: unknown) => typeof item === "string" && item.trim()).slice(0, 4)
        : fallbackDraft(input).labels,
      priority: ["low", "medium", "high"].includes(parsed.priority) ? parsed.priority : "medium",
      estimatedHours:
        typeof parsed.estimatedHours === "number" && parsed.estimatedHours > 0
          ? Math.min(Math.round(parsed.estimatedHours), 40)
          : fallbackDraft(input).estimatedHours,
    };
  } catch {
    return fallbackDraft(input);
  }
};

const parseJsonObject = (content: string): any | null => {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : content);
  } catch {
    return null;
  }
};

const callNvidia = async (prompt: string, system: string, maxTokens = 700): Promise<string | null> => {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      temperature: 0.35,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : null;
};

const fallbackSummary = (input: TaskSummaryInput): TaskSummaryResult => {
  const completed = input.subtasks?.filter((sub) => sub.isCompleted).length || 0;
  const total = input.subtasks?.length || 0;
  const parts = [
    input.description?.trim() || `This task is about "${input.title.trim()}".`,
    input.status ? `Current status: ${input.status}.` : "",
    total ? `Checklist progress: ${completed}/${total}.` : "",
  ].filter(Boolean);

  const openSubtasks = input.subtasks?.filter((sub) => !sub.isCompleted).map((sub) => sub.title).slice(0, 3) || [];

  return {
    summary: parts.join(" "),
    nextSteps: openSubtasks.length ? openSubtasks : ["Confirm the next action", "Complete the highest-impact remaining work"],
    blockers: input.comments?.some((comment) => /block|stuck|issue|error|fail/i.test(comment))
      ? ["Recent comments may mention blockers. Review the latest discussion."]
      : [],
  };
};

const parseSummary = (content: string, input: TaskSummaryInput): TaskSummaryResult => {
  const parsed = parseJsonObject(content);
  if (!parsed) return fallbackSummary(input);

  return {
    summary:
      typeof parsed.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : fallbackSummary(input).summary,
    nextSteps: Array.isArray(parsed.nextSteps)
      ? parsed.nextSteps.filter((item: unknown) => typeof item === "string" && item.trim()).slice(0, 5)
      : fallbackSummary(input).nextSteps,
    blockers: Array.isArray(parsed.blockers)
      ? parsed.blockers.filter((item: unknown) => typeof item === "string" && item.trim()).slice(0, 4)
      : fallbackSummary(input).blockers,
  };
};

const fallbackCommentRewrite = (input: CommentRewriteInput): CommentRewriteResult => {
  const cleaned = input.content.replace(/\s+/g, " ").trim();
  if (!cleaned) return { content: input.content };

  const withCapital = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  const content = /[.!?]$/.test(withCapital) ? withCapital : `${withCapital}.`;
  return { content };
};

export const generateTaskDraft = async (input: TaskDraftInput): Promise<TaskDraftResult> => {
  const prompt = [
    "Create a concise project-management task draft.",
    "Return only valid JSON with these keys: title, description, checklist, labels, priority, estimatedHours.",
    "priority must be one of low, medium, high. checklist should have 3-6 practical items. labels should be short.",
    `Task title: ${input.title}`,
    input.projectName ? `Project: ${input.projectName}` : "",
    input.workspaceName ? `Workspace: ${input.workspaceName}` : "",
    input.existingTasks?.length ? `Nearby tasks: ${input.existingTasks.slice(0, 8).join(", ")}` : "",
  ].filter(Boolean).join("\n");

  const content = await callNvidia(
    prompt,
    "You are a precise task-planning assistant for a project management app.",
    700
  );
  if (!content) {
    return fallbackDraft(input);
  }

  return parseDraft(content, input);
};

export const generateTaskSummary = async (input: TaskSummaryInput): Promise<TaskSummaryResult> => {
  const prompt = [
    "Summarize this project-management task for a teammate who needs fast context.",
    "Return only valid JSON with keys: summary, nextSteps, blockers.",
    "summary should be 1-2 concise sentences. nextSteps and blockers should be arrays of short practical items.",
    `Title: ${input.title}`,
    input.description ? `Description: ${input.description}` : "",
    input.status ? `Status: ${input.status}` : "",
    input.priority ? `Priority: ${input.priority}` : "",
    input.labels?.length ? `Labels: ${input.labels.join(", ")}` : "",
    input.subtasks?.length
      ? `Checklist: ${input.subtasks.map((sub) => `${sub.isCompleted ? "[done]" : "[open]"} ${sub.title}`).join("; ")}`
      : "",
    input.comments?.length ? `Recent comments: ${input.comments.slice(-5).join(" | ")}` : "",
  ].filter(Boolean).join("\n");

  const content = await callNvidia(
    prompt,
    "You are a concise project manager. Be practical, specific, and avoid hype.",
    650
  );
  if (!content) return fallbackSummary(input);

  return parseSummary(content, input);
};

export const rewriteComment = async (input: CommentRewriteInput): Promise<CommentRewriteResult> => {
  const prompt = [
    "Rewrite this task comment to be clear, polite, and professional while keeping the same meaning.",
    "Return only valid JSON with the key: content.",
    "Keep it short. Do not add new facts.",
    input.taskTitle ? `Task: ${input.taskTitle}` : "",
    `Comment: ${input.content}`,
  ].filter(Boolean).join("\n");

  const content = await callNvidia(
    prompt,
    "You improve workplace comments without changing intent.",
    350
  );
  if (!content) return fallbackCommentRewrite(input);

  const parsed = parseJsonObject(content);
  if (!parsed || typeof parsed.content !== "string" || !parsed.content.trim()) {
    return fallbackCommentRewrite(input);
  }

  return { content: parsed.content.trim() };
};
