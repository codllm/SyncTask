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
exports.stopScheduler = exports.startScheduler = exports.checkUpcomingReminders = exports.checkRecurringTasks = exports.calculateNextRun = void 0;
const task_model_1 = __importDefault(require("../model/task.model"));
const project_model_1 = __importDefault(require("../model/project.model"));
const notification_service_1 = require("./notification.service");
const socket_1 = require("./socket");
const activity_service_1 = require("./activity.service");
// Helper to calculate the next run date based on frequency
const calculateNextRun = (frequency, fromDate = new Date()) => {
    const next = new Date(fromDate);
    switch (frequency) {
        case "daily":
            next.setDate(next.getDate() + 1);
            break;
        case "weekly":
            next.setDate(next.getDate() + 7);
            break;
        case "monthly":
            next.setMonth(next.getMonth() + 1);
            break;
        default:
            // Fallback in case of invalid or 'none' frequency
            next.setDate(next.getDate() + 1);
    }
    return next;
};
exports.calculateNextRun = calculateNextRun;
// Check and process recurring tasks
const checkRecurringTasks = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = new Date();
        // Find tasks that are recurring and past their nextRun date
        const overdueTasks = yield task_model_1.default.find({
            "recurring.isRecurring": true,
            "recurring.nextRun": { $lte: now },
            isArchived: { $ne: true },
        });
        for (const task of overdueTasks) {
            try {
                const nextRun = task.recurring.nextRun || now;
                // Determine the next run date that is in the future
                let newNextRun = (0, exports.calculateNextRun)(task.recurring.frequency, nextRun);
                while (newNextRun <= now) {
                    newNextRun = (0, exports.calculateNextRun)(task.recurring.frequency, newNextRun);
                }
                // Get current count of tasks in 'todo' status to assign new position
                const todoCount = yield task_model_1.default.countDocuments({
                    project: task.project,
                    status: "todo",
                });
                // Clone the task:
                // Set status to todo, clear dependencies, reset subtask completion, and isRecurring: false on the clone
                const cloneData = {
                    title: task.title,
                    description: task.description,
                    status: "todo",
                    priority: task.priority,
                    project: task.project,
                    assignedTo: task.assignedTo,
                    createdBy: task.createdBy,
                    labels: task.labels,
                    subtasks: task.subtasks.map((st) => ({
                        title: st.title,
                        completed: false,
                    })),
                    position: todoCount,
                    recurring: {
                        isRecurring: false,
                        frequency: "none",
                    },
                };
                const clonedTask = yield task_model_1.default.create(cloneData);
                // Update the original task with the advanced nextRun
                task.recurring.nextRun = newNextRun;
                yield task.save();
                // Populate and emit updates
                const populatedClonedTask = yield task_model_1.default.findById(clonedTask._id)
                    .populate("assignedTo", "username email")
                    .populate("createdBy", "username email");
                if (populatedClonedTask) {
                    (0, socket_1.emitToProject)(task.project.toString(), "task:created", populatedClonedTask);
                }
                // Log activity for the creation of the cloned task
                const project = yield project_model_1.default.findById(task.project);
                if (project) {
                    yield (0, activity_service_1.createActivityLog)({
                        workspace: project.workspace.toString(),
                        project: project._id.toString(),
                        task: clonedTask._id.toString(),
                        user: task.createdBy.toString(),
                        action: "task_created",
                        details: `automatically created recurring task instance "${clonedTask.title}"`,
                    });
                }
            }
            catch (err) {
                console.error(`Error processing recurring task ${task._id}:`, err);
            }
        }
    }
    catch (error) {
        console.error("Error checking recurring tasks:", error);
    }
});
exports.checkRecurringTasks = checkRecurringTasks;
// Check for upcoming deadlines and send reminders
const checkUpcomingReminders = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setHours(tomorrow.getHours() + 24);
        // Find tasks due within the next 24 hours that haven't received a reminder
        const tasksDueSoon = yield task_model_1.default.find({
            dueDate: { $gte: now, $lte: tomorrow },
            status: { $ne: "completed" },
            isArchived: { $ne: true },
            reminderSent: { $ne: true },
        }).populate("assignedTo", "username email");
        for (const task of tasksDueSoon) {
            try {
                if (task.assignedTo && task.assignedTo.length > 0) {
                    for (const assignee of task.assignedTo) {
                        yield (0, notification_service_1.createNotification)({
                            recipient: assignee._id.toString(),
                            sender: task.createdBy.toString(),
                            type: "TASK_UPDATED",
                            title: "Task Due Tomorrow",
                            message: `The task "${task.title}" is due tomorrow!`,
                            link: `/projects/${task.project}/tasks/${task._id}`,
                        });
                    }
                }
                // Mark reminder as sent
                task.reminderSent = true;
                yield task.save();
            }
            catch (err) {
                console.error(`Error sending reminder for task ${task._id}:`, err);
            }
        }
    }
    catch (error) {
        console.error("Error checking upcoming reminders:", error);
    }
});
exports.checkUpcomingReminders = checkUpcomingReminders;
let intervalId = null;
const startScheduler = () => {
    if (intervalId)
        return;
    console.log("Starting background task scheduler...");
    // Run checks immediately on startup
    (0, exports.checkRecurringTasks)();
    (0, exports.checkUpcomingReminders)();
    // Run checks every 60 seconds
    intervalId = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, exports.checkRecurringTasks)();
        yield (0, exports.checkUpcomingReminders)();
    }), 60000);
};
exports.startScheduler = startScheduler;
const stopScheduler = () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log("Stopped background task scheduler.");
    }
};
exports.stopScheduler = stopScheduler;
