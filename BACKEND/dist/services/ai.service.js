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
    const response = yield fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
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
    if (!response.ok)
        return null;
    const data = yield response.json();
    const content = (_c = (_b = (_a = data === null || data === void 0 ? void 0 : data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content;
    return typeof content === "string" ? content : null;
});
const fallbackSummary = (input) => {
    var _a, _b, _c, _d, _e;
    const completed = ((_a = input.subtasks) === null || _a === void 0 ? void 0 : _a.filter((sub) => sub.isCompleted).length) || 0;
    const total = ((_b = input.subtasks) === null || _b === void 0 ? void 0 : _b.length) || 0;
    const parts = [
        ((_c = input.description) === null || _c === void 0 ? void 0 : _c.trim()) || `This task is about "${input.title.trim()}".`,
        input.status ? `Current status: ${input.status}.` : "",
        total ? `Checklist progress: ${completed}/${total}.` : "",
    ].filter(Boolean);
    const openSubtasks = ((_d = input.subtasks) === null || _d === void 0 ? void 0 : _d.filter((sub) => !sub.isCompleted).map((sub) => sub.title).slice(0, 3)) || [];
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
        "Create a concise project-management task draft.",
        "Return only valid JSON with these keys: title, description, checklist, labels, priority, estimatedHours.",
        "priority must be one of low, medium, high. checklist should have 3-6 practical items. labels should be short.",
        `Task title: ${input.title}`,
        input.projectName ? `Project: ${input.projectName}` : "",
        input.workspaceName ? `Workspace: ${input.workspaceName}` : "",
        ((_a = input.existingTasks) === null || _a === void 0 ? void 0 : _a.length) ? `Nearby tasks: ${input.existingTasks.slice(0, 8).join(", ")}` : "",
    ].filter(Boolean).join("\n");
    const content = yield callNvidia(prompt, "You are a precise task-planning assistant for a project management app.", 700);
    if (!content) {
        return fallbackDraft(input);
    }
    return parseDraft(content, input);
});
exports.generateTaskDraft = generateTaskDraft;
const generateTaskSummary = (input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const prompt = [
        "Summarize this project-management task for a teammate who needs fast context.",
        "Return only valid JSON with keys: summary, nextSteps, blockers.",
        "summary should be 1-2 concise sentences. nextSteps and blockers should be arrays of short practical items.",
        `Title: ${input.title}`,
        input.description ? `Description: ${input.description}` : "",
        input.status ? `Status: ${input.status}` : "",
        input.priority ? `Priority: ${input.priority}` : "",
        ((_a = input.labels) === null || _a === void 0 ? void 0 : _a.length) ? `Labels: ${input.labels.join(", ")}` : "",
        ((_b = input.subtasks) === null || _b === void 0 ? void 0 : _b.length)
            ? `Checklist: ${input.subtasks.map((sub) => `${sub.isCompleted ? "[done]" : "[open]"} ${sub.title}`).join("; ")}`
            : "",
        ((_c = input.comments) === null || _c === void 0 ? void 0 : _c.length) ? `Recent comments: ${input.comments.slice(-5).join(" | ")}` : "",
    ].filter(Boolean).join("\n");
    const content = yield callNvidia(prompt, "You are a concise project manager. Be practical, specific, and avoid hype.", 650);
    if (!content)
        return fallbackSummary(input);
    return parseSummary(content, input);
});
exports.generateTaskSummary = generateTaskSummary;
const rewriteComment = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const prompt = [
        "Rewrite this task comment to be clear, polite, and professional while keeping the same meaning.",
        "Return only valid JSON with the key: content.",
        "Keep it short. Do not add new facts.",
        input.taskTitle ? `Task: ${input.taskTitle}` : "",
        `Comment: ${input.content}`,
    ].filter(Boolean).join("\n");
    const content = yield callNvidia(prompt, "You improve workplace comments without changing intent.", 350);
    if (!content)
        return fallbackCommentRewrite(input);
    const parsed = parseJsonObject(content);
    if (!parsed || typeof parsed.content !== "string" || !parsed.content.trim()) {
        return fallbackCommentRewrite(input);
    }
    return { content: parsed.content.trim() };
});
exports.rewriteComment = rewriteComment;
