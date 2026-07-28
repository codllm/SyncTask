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
exports.rewriteComment = exports.generateTaskSummary = exports.generateTaskDraft = exports.composeReadyCommentFromInstruction = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: ".env.local" });
dotenv_1.default.config();
const AI_BASE_URL = process.env.OPENROUTER_BASE_URL ||
    process.env.AI_BASE_URL ||
    process.env.NVIDIA_BASE_URL ||
    "https://openrouter.ai/api/v1";
const AI_MODEL = process.env.OPENROUTER_MODEL ||
    process.env.AI_MODEL ||
    process.env.NVIDIA_MODEL ||
    "inclusionai/ling-3.0-flash:free";
const isGenericTaskRequest = (title) => /\b(give|suggest|create|make|write|draft)\b.*\b(task|todo|work|item)\b/i.test(title) ||
    /\bnew task\b/i.test(title);
const normalizeTaskTitle = (input) => {
    const cleanTitle = input.title.replace(/\s+/g, " ").trim();
    if (!isGenericTaskRequest(cleanTitle))
        return cleanTitle;
    if (input.projectName)
        return `Plan next steps for ${input.projectName}`;
    if (input.workspaceName)
        return `Plan next workspace task`;
    return "Plan the next actionable project task";
};
const fallbackDraft = (input) => {
    const cleanTitle = normalizeTaskTitle(input);
    return {
        title: cleanTitle,
        description: `Define the expected outcome for ${cleanTitle.toLowerCase()}, break it into clear steps, complete the core work, verify the result, and capture any follow-up decisions.`,
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
        const parsedTitle = typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : "";
        return {
            title: parsedTitle && !isGenericTaskRequest(parsedTitle) ? parsedTitle : normalizeTaskTitle(input),
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
const extractAiContent = (content) => {
    if (typeof content === "string")
        return content;
    if (Array.isArray(content)) {
        const parts = content
            .map((part) => {
            if (typeof part === "string")
                return part;
            if (part && typeof part === "object") {
                const text = part.text;
                const nestedContent = part.content;
                if (typeof text === "string")
                    return text;
                if (typeof nestedContent === "string")
                    return nestedContent;
            }
            return "";
        })
            .filter(Boolean);
        return parts.length ? parts.join("") : null;
    }
    if (content && typeof content === "object") {
        const text = content.text;
        const nestedContent = content.content;
        if (typeof text === "string")
            return text;
        if (typeof nestedContent === "string")
            return nestedContent;
    }
    return null;
};
const getAiApiKey = () => process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY || process.env.NVIDIA_API_KEY;
const getAiProviderName = () => {
    if (process.env.OPENROUTER_API_KEY || AI_BASE_URL.includes("openrouter.ai"))
        return "OpenRouter";
    if (process.env.NVIDIA_API_KEY || AI_BASE_URL.includes("nvidia.com"))
        return "Nvidia";
    return "AI provider";
};
const buildAiHeaders = (apiKey) => {
    const headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
    };
    if (AI_BASE_URL.includes("openrouter.ai")) {
        const referer = process.env.OPENROUTER_HTTP_REFERER || process.env.OPENROUTER_SITE_URL;
        const appName = process.env.OPENROUTER_APP_NAME || "Task Project Management";
        if (referer)
            headers["HTTP-Referer"] = referer;
        if (appName)
            headers["X-Title"] = appName;
    }
    return headers;
};
const callAiProvider = (prompt_1, system_1, ...args_1) => __awaiter(void 0, [prompt_1, system_1, ...args_1], void 0, function* (prompt, system, maxTokens = 700) {
    var _a, _b, _c;
    const apiKey = getAiApiKey();
    if (!apiKey)
        return null;
    try {
        const response = yield fetch(`${AI_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: buildAiHeaders(apiKey),
            body: JSON.stringify({
                model: AI_MODEL,
                temperature: 0.15,
                max_tokens: maxTokens,
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: prompt },
                ],
            }),
        });
        if (!response.ok) {
            console.error(`${getAiProviderName()} API error: ${response.status} ${response.statusText}`);
            return null;
        }
        const data = yield response.json();
        const content = (_c = (_b = (_a = data === null || data === void 0 ? void 0 : data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content;
        return extractAiContent(content);
    }
    catch (error) {
        console.error(`Error calling ${getAiProviderName()} API:`, error);
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
const isExistingReadyComment = (cleaned) => {
    const lower = cleaned.toLowerCase();
    return (/^congratulations\b/.test(lower) ||
        /^congrats\b/.test(lower) ||
        /^thank you\b/.test(lower) ||
        /^thanks\b/.test(lower) ||
        /^could you\b/.test(lower) ||
        /^please\b/.test(lower) ||
        /^great work\b/.test(lower));
};
const composeReadyCommentFromInstruction = (input) => {
    const cleaned = input.content.replace(/\s+/g, " ").trim();
    if (!cleaned)
        return null;
    if (isExistingReadyComment(cleaned))
        return null;
    const lowerIntent = `${cleaned} ${input.taskTitle || ""}`.toLowerCase();
    const hasFastIntent = /fast|quick|quickly|early|first|before time|ahead/.test(lowerIntent);
    if (/congrat|congrats/.test(lowerIntent)) {
        const speedPhrase = hasFastIntent ? " so quickly" : "";
        return `Congratulations on completing this${speedPhrase}. Great work!`;
    }
    if (/\b(thank|thanks|appreciate)\b/.test(lowerIntent)) {
        if (/complete|finish|done|resolve|close/.test(lowerIntent)) {
            const speedPhrase = hasFastIntent ? " so quickly" : "";
            return `Thank you for completing this${speedPhrase}. Great work!`;
        }
        return "Thank you for your help with this.";
    }
    if (/\b(ask|tell|request|remind)\b/.test(lowerIntent) && /\b(update|status|progress)\b/.test(lowerIntent)) {
        const timePhrase = /today/.test(lowerIntent) ? " by today" : /tomorrow/.test(lowerIntent) ? " by tomorrow" : "";
        return `Could you please share an update on this task${timePhrase}?`;
    }
    if (/\b(ask|tell|request|remind)\b/.test(lowerIntent) && /\b(review|check|verify|feedback)\b/.test(lowerIntent)) {
        return "Could you please review this and share your feedback?";
    }
    if (/\b(ask|tell|request|remind)\b/.test(lowerIntent) && /\b(complete|finish|done|close)\b/.test(lowerIntent)) {
        const timePhrase = /today/.test(lowerIntent) ? " by today" : /tomorrow/.test(lowerIntent) ? " by tomorrow" : "";
        return `Could you please complete this task${timePhrase}?`;
    }
    if (/\b(apologize|apologise|sorry)\b/.test(lowerIntent)) {
        return "Sorry for the confusion. I will take care of this.";
    }
    return null;
};
exports.composeReadyCommentFromInstruction = composeReadyCommentFromInstruction;
const looksLikeUnconvertedInstruction = (content) => {
    const lower = content.toLowerCase();
    return /\b(wish|write|make|create|draft|ask|tell|reply|comment|request|remind)\b/.test(lower);
};
const fallbackCommentRewrite = (input) => {
    const cleaned = input.content.replace(/\s+/g, " ").trim();
    if (!cleaned)
        return { content: input.content };
    const composed = (0, exports.composeReadyCommentFromInstruction)(input);
    if (composed)
        return { content: composed };
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
    const content = yield callAiProvider(prompt, system, 700);
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
    const content = yield callAiProvider(prompt, system, 650);
    if (!content)
        return fallbackSummary(input);
    return parseSummary(content, input);
});
exports.generateTaskSummary = generateTaskSummary;
const rewriteComment = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const composed = (0, exports.composeReadyCommentFromInstruction)(input);
    if (composed)
        return { content: composed };
    const prompt = [
        `Turn the user's text into a ready-to-post task comment for a project management app.`,
        `If the user's text is already a comment, polish it for clarity, warmth, and professionalism.`,
        `If the user's text is an instruction or request like "wish him congratulations", "ask her for an update", or "thank them for finishing fast", write the actual comment that should be posted. Do not repeat the instruction.`,
        `Keep the comment natural, concise, and directly usable. Use second person when appropriate.`,
        input.taskTitle ? `Task context: ${input.taskTitle}` : "",
        `User text: "${input.content}"`,
        ``,
        `Examples:`,
        `User text: "Wish him congratulation for completed first."`,
        `Output content: "Congratulations on completing this so quickly. Great work!"`,
        `User text: "ask her to share an update by today"`,
        `Output content: "Could you please share an update by today?"`,
        ``,
        `You MUST return a JSON object with exactly the following key and type:`,
        `{`,
        `  "content": "The rewritten comment text"`,
        `}`
    ].filter(Boolean).join("\n");
    const system = "You are a task comment drafting assistant. Convert user instructions into the actual comment text, and polish existing comments without changing their intent. You MUST respond with a single valid JSON object and nothing else. No conversational text, no introductions, no markdown code block formatting, no backticks. Only the raw JSON object.";
    const content = yield callAiProvider(prompt, system, 350);
    if (!content)
        return fallbackCommentRewrite(input);
    const parsed = parseJsonObject(content);
    if (!parsed || typeof parsed.content !== "string" || !parsed.content.trim()) {
        return fallbackCommentRewrite(input);
    }
    const polishedContent = parsed.content.trim();
    if (looksLikeUnconvertedInstruction(polishedContent)) {
        return fallbackCommentRewrite(input);
    }
    return { content: polishedContent };
});
exports.rewriteComment = rewriteComment;
