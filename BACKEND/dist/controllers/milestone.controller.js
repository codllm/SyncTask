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
exports.deleteMilestone = exports.updateMilestone = exports.getProjectMilestones = exports.createMilestone = void 0;
const milestone_model_1 = __importDefault(require("../model/milestone.model"));
const task_model_1 = __importDefault(require("../model/task.model"));
const createMilestone = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, project, dueDate, status, tasks } = req.body;
        const milestone = yield milestone_model_1.default.create({
            title,
            description,
            project,
            dueDate,
            status: status || "active",
            tasks: tasks || [],
        });
        if (tasks && tasks.length > 0) {
            yield task_model_1.default.updateMany({ _id: { $in: tasks } }, { $set: { milestone: milestone._id } });
        }
        return res.status(201).json({
            success: true,
            milestone,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create milestone",
        });
    }
});
exports.createMilestone = createMilestone;
const getProjectMilestones = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId } = req.params;
        const milestones = yield milestone_model_1.default.find({ project: projectId }).populate("tasks");
        return res.status(200).json({
            success: true,
            milestones,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch milestones",
        });
    }
});
exports.getProjectMilestones = getProjectMilestones;
const updateMilestone = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { milestoneId } = req.params;
        const { title, description, dueDate, status, tasks } = req.body;
        const milestone = yield milestone_model_1.default.findById(milestoneId);
        if (!milestone) {
            return res.status(404).json({ success: false, message: "Milestone not found" });
        }
        if (title !== undefined)
            milestone.title = title;
        if (description !== undefined)
            milestone.description = description;
        if (dueDate !== undefined)
            milestone.dueDate = dueDate;
        if (status !== undefined)
            milestone.status = status;
        if (tasks !== undefined) {
            const oldTasks = milestone.tasks.map((id) => id.toString());
            const newTasks = tasks.map((id) => id.toString());
            const removedTasks = oldTasks.filter((id) => !newTasks.includes(id));
            if (removedTasks.length > 0) {
                yield task_model_1.default.updateMany({ _id: { $in: removedTasks } }, { $unset: { milestone: "" } });
            }
            if (newTasks.length > 0) {
                yield task_model_1.default.updateMany({ _id: { $in: newTasks } }, { $set: { milestone: milestone._id } });
            }
            milestone.tasks = tasks;
        }
        yield milestone.save();
        const populatedMilestone = yield milestone_model_1.default.findById(milestoneId).populate("tasks");
        return res.status(200).json({
            success: true,
            milestone: populatedMilestone,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update milestone",
        });
    }
});
exports.updateMilestone = updateMilestone;
const deleteMilestone = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { milestoneId } = req.params;
        const milestone = yield milestone_model_1.default.findById(milestoneId);
        if (!milestone) {
            return res.status(404).json({ success: false, message: "Milestone not found" });
        }
        yield task_model_1.default.updateMany({ milestone: milestoneId }, { $unset: { milestone: "" } });
        yield milestone_model_1.default.findByIdAndDelete(milestoneId);
        return res.status(200).json({
            success: true,
            message: "Milestone deleted successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete milestone",
        });
    }
});
exports.deleteMilestone = deleteMilestone;
