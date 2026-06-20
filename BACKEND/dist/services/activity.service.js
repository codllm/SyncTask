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
exports.getWorkspaceActivitiesService = exports.createActivityLog = void 0;
const activity_model_1 = __importDefault(require("../model/activity.model"));
const createActivityLog = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const activity = yield activity_model_1.default.create(data);
        return activity;
    }
    catch (err) {
        console.error("Failed to write activity log:", err);
    }
});
exports.createActivityLog = createActivityLog;
const getWorkspaceActivitiesService = (workspaceId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield activity_model_1.default.find({ workspace: workspaceId })
        .populate("user", "username email")
        .populate("project", "name")
        .populate("task", "title")
        .sort({ createdAt: -1 })
        .limit(50);
});
exports.getWorkspaceActivitiesService = getWorkspaceActivitiesService;
