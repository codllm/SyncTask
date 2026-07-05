"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rewriteComment = exports.generateTaskSummary = exports.generateTaskDraft = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: ".env.local" });
dotenv_1.default.config();
const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || "meta/llama-3.1-70b-instruct";
const fallbackDraft = (input) => {
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
const parseDraft = (content, input) => {
    try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
        return {
            title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : input.title.trim(),
            description: typeof parsed.description === "string" && parsed.description.trim()
                ? parsed.description.trim()
                : fallbackDraft(input).description,
            checklist: Array.isArray(parsed.checklist)
                ? parsed.checklist.filter((item) => typeof item === "string" && item.trim()).slice(0, 6)
                : fallbackDraft(input).checklist,
            labels: Array.isArray(parsed.labels)
                ? parsed.labels.filter((item) => typeof item === "string" && item.trim()).slice(0, 4)
                : fallbackDraft(input).labels,
            priority: ["low", "medium", "high"].includes(parsed.priority) ? parsed.priority : "medium",
            estimatedHours: typeof parsed.estimatedHours === "number" && parsed.estimatedHours > 0
                ? Math.min(Math.round(parsed.estimatedHours), 40)
                : fallbackDraft(input).estimatedHours,
        };
    }
    catch (_a) {
        return fallbackDraft(input);
    }
};
const parseJsonObject = (content) => {
    try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : content);
    }
    catch (_a) {
        return null;
    }
};
const callNvidia = (prompt_1, system_1, ...args_1) => __awaiter(void 0, [prompt_1, system_1, ...args_1], void 0, function* (prompt, system, maxTokens = 700) {
    var _a, _b, _c;
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey)
        return null;
    try {
        const response = yield fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: NVIDIA_MODEL,
                temperature: 0.15,
                max_tokens: maxTokens,
                response_format: { type: "json_object" },
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: prompt },
                ],
            }),
        });
        if (!response.ok) {
            console.error(`Nvidia API error: ${response.status} ${response.statusText}`);
            return null;
        }
        const data = yield response.json();
        const content = (_c = (_b = (_a = data === null || data === void 0 ? void 0 : data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content;
        return typeof content === "string" ? content : null;
    }
    catch (error) {
        console.error("Error calling Nvidia API:", error);
        return null;
    }
});
const fallbackSummary = (input) => {
    var _a, _b, _c, _d, _e;
    const completed = ((_a = input.subtasks) === null || _a === void 0 ? void 0 : _a.filter((sub) => sub.completed || sub.isCompleted).length) || 0;
    const total = ((_b = input.subtasks) === null || _b === void 0 ? void 0 : _b.length) || 0;
    const parts = [
        ((_c = input.description) === null || _c === void 0 ? void 0 : _c.trim()) || `This task is about "${input.title.trim()}".`,
        input.status ? `Current status: ${input.status}.` : "",
        total ? `Checklist progress: ${completed}/${total}.` : "",
    ].filter(Boolean);
    const openSubtasks = ((_d = input.subtasks) === null || _d === void 0 ? void 0 : _d.filter((sub) => !sub.completed && !sub.isCompleted).map((sub) => sub.title).slice(0, 3)) || [];
    return {
        summary: parts.join(" "),
        nextSteps: openSubtasks.length ? openSubtasks : ["Confirm the next action", "Complete the highest-impact remaining work"],
        blockers: ((_e = input.comments) === null || _e === void 0 ? void 0 : _e.some((comment) => /block|stuck|issue|error|fail/i.test(comment)))
            ? ["Recent comments may mention blockers. Review the latest discussion."]
            : [],
    };
};
const parseSummary = (content, input) => {
    const parsed = parseJsonObject(content);
    if (!parsed)
        return fallbackSummary(input);
    return {
        summary: typeof parsed.summary === "string" && parsed.summary.trim()
            ? parsed.summary.trim()
            : fallbackSummary(input).summary,
        nextSteps: Array.isArray(parsed.nextSteps)
            ? parsed.nextSteps.filter((item) => typeof item === "string" && item.trim()).slice(0, 5)
            : fallbackSummary(input).nextSteps,
        blockers: Array.isArray(parsed.blockers)
            ? parsed.blockers.filter((item) => typeof item === "string" && item.trim()).slice(0, 4)
            : fallbackSummary(input).blockers,
    };
};
const fallbackCommentRewrite = (input) => {
    const cleaned = input.content.replace(/\s+/g, " ").trim();
    if (!cleaned)
        return { content: input.content };
    const withCapital = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    const content = /[.!?]$/.test(withCapital) ? withCapital : `${withCapital}.`;
    return { content };
};
const generateTaskDraft = (input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const prompt = [
        `Generate a precise task draft for a project management app.`,
        `Task input title: "${input.title}"`,
        input.projectName ? `Project context: ${input.projectName}` : "",
        input.workspaceName ? `Workspace context: ${input.workspaceName}` : "",
        ((_a = input.existingTasks) === null || _a === void 0 ? void 0 : _a.length) ? `Nearby task titles in the same project: ${input.existingTasks.slice(0, 8).join(", ")}` : "",
        ``,
        `You MUST return a JSON object with exactly the following keys and types:`,
        `{`,
        `  "title": "A clear, action-oriented task title based on the input title",`,
        `  "description": "A detailed description explaining what needs to be done, background, and acceptance criteria",`,
        `  "checklist": ["3 to 6 practical step-by-step checklist items to complete the task"],`,
        `  "labels": ["1 to 3 short relevant labels"],`,
        `  "priority": "low" | "medium" | "high",`,
        `  "estimatedHours": number (integer between 1 and 40)`,
        `}`
    ].filter(Boolean).join("\n");
    const system = "You are a precise task-planning assistant. You MUST respond with a single valid JSON object and nothing else. No conversational text, no introductions, no markdown code block formatting, no backticks. Only the raw JSON object.";
    const content = yield callNvidia(prompt, system, 700);
    if (!content) {
        return fallbackDraft(input);
    }
    return parseDraft(content, input);
});
exports.generateTaskDraft = generateTaskDraft;
const generateTaskSummary = (input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const prompt = [
        `Summarize this project-management task for a teammate who needs fast context.`,
        `Task Details:`,
        `- Title: ${input.title}`,
        input.description ? `- Description: ${input.description}` : "",
        input.status ? `- Status: ${input.status}` : "",
        input.priority ? `- Priority: ${input.priority}` : "",
        ((_a = input.labels) === null || _a === void 0 ? void 0 : _a.length) ? `- Labels: ${input.labels.join(", ")}` : "",
        ((_b = input.subtasks) === null || _b === void 0 ? void 0 : _b.length)
            ? `- Checklist items: ${input.subtasks.map((sub) => `${(sub.completed || sub.isCompleted) ? "[done]" : "[open]"} ${sub.title}`).join("; ")}`
            : "",
        ((_c = input.comments) === null || _c === void 0 ? void 0 : _c.length) ? `- Recent discussion comments: ${input.comments.slice(-5).join(" | ")}` : "",
        ``,
        `You MUST return a JSON object with exactly the following keys and types:`,
        `{`,
        `  "summary": "1-2 concise sentences summarizing the task goal and current progress",`,
        `  "nextSteps": ["2 to 4 short practical next actions to take"],`,
        `  "blockers": ["Any blockers, issues, or risks identified, or an empty array if none"]`,
        `}`
    ].filter(Boolean).join("\n");
    const system = "You are a precise project manager assistant. You MUST respond with a single valid JSON object and nothing else. No conversational text, no introductions, no markdown code block formatting, no backticks. Only the raw JSON object.";
    const content = yield callNvidia(prompt, system, 650);
    if (!content)
        return fallbackSummary(input);
    return parseSummary(content, input);
});
exports.generateTaskSummary = generateTaskSummary;
const rewriteComment = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const prompt = [
        `Rewrite this task comment to be clear, polite, and professional while keeping the exact same meaning.`,
        input.taskTitle ? `Task context: ${input.taskTitle}` : "",
        `Original Comment: "${input.content}"`,
        ``,
        `You MUST return a JSON object with exactly the following key and type:`,
        `{`,
        `  "content": "The rewritten comment text"`,
        `}`
    ].filter(Boolean).join("\n");
    const system = "You improve workplace comments for clarity and professionalism while preserving intent. You MUST respond with a single valid JSON object and nothing else. No conversational text, no introductions, no markdown code block formatting, no backticks. Only the raw JSON object.";
    const content = yield callNvidia(prompt, system, 350);
    if (!content)
        return fallbackCommentRewrite(input);
    const parsed = parseJsonObject(content);
    if (!parsed || typeof parsed.content !== "string" || !parsed.content.trim()) {
        return fallbackCommentRewrite(input);
    }
    return { content: parsed.content.trim() };
});
exports.rewriteComment = rewriteComment;
