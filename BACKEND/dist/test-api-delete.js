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
const db_1 = __importDefault(require("./config/db"));
const user_model_1 = __importDefault(require("./model/user.model"));
const workspace_model_1 = __importDefault(require("./model/workspace.model"));
const project_model_1 = __importDefault(require("./model/project.model"));
const task_model_1 = __importDefault(require("./model/task.model"));
const workspace_middleware_1 = require("./middleware/workspace.middleware");
const task_controller_1 = require("./controllers/task.controller");
const mongoose_1 = __importDefault(require("mongoose"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, db_1.default)();
        // Find or create test user
        let user = yield user_model_1.default.findOne({ email: "test.delete@todo.com" });
        if (!user) {
            user = yield user_model_1.default.create({
                username: { firstname: "Test", lastname: "Delete" },
                email: "test.delete@todo.com",
                password: "password123!",
                gender: "other",
                usertype: "individual",
            });
        }
        // Create Workspace
        const workspace = yield workspace_model_1.default.create({
            name: "Todo Workspace Test",
            owner: user._id,
            members: [{ user: user._id, role: "owner" }]
        });
        // Create Project
        const project = yield project_model_1.default.create({
            name: "Todo Project Test",
            workspace: workspace._id,
            createdBy: user._id,
            members: [{ user: user._id, role: "admin" }]
        });
        // Create Task
        const task = yield task_model_1.default.create({
            title: "Test task to delete",
            project: project._id,
            createdBy: user._id,
            status: "todo",
            position: 0
        });
        console.log("Mocking request with task ID:", task._id);
        // Mock req, res, next
        const req = {
            params: { taskId: task._id.toString() },
            user: user,
            body: {}
        };
        let statusVal = 200;
        let jsonVal = null;
        const res = {
            status: (code) => {
                statusVal = code;
                return res;
            },
            json: (data) => {
                jsonVal = data;
                return res;
            }
        };
        const next = () => __awaiter(this, void 0, void 0, function* () {
            yield (0, task_controller_1.deleteTaskController)(req, res);
            console.log("Controller execution completed. Status:", statusVal, "Json:", jsonVal);
        });
        try {
            yield (0, workspace_middleware_1.blockViewers)(req, res, next);
        }
        catch (err) {
            console.error("Error during execution:", err);
        }
        // Clean up
        yield task_model_1.default.deleteOne({ _id: task._id });
        yield project_model_1.default.deleteOne({ _id: project._id });
        yield workspace_model_1.default.deleteOne({ _id: workspace._id });
        yield user_model_1.default.deleteOne({ _id: user._id });
        mongoose_1.default.disconnect();
    });
}
run().catch(console.error);
