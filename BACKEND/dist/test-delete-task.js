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
const task_model_1 = __importDefault(require("./model/task.model"));
const task_service_1 = require("./services/task.service");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, db_1.default)();
            const task = yield task_model_1.default.findOne({ isDeleted: { $ne: true } });
            if (!task) {
                console.log("No active tasks found in database.");
                process.exit(0);
            }
            console.log("Found task to test delete:", task.title, task._id);
            const res = yield (0, task_service_1.deleteTaskService)(task._id.toString(), task.createdBy.toString());
            console.log("Task soft deleted successfully:", res === null || res === void 0 ? void 0 : res.title, "isDeleted:", res === null || res === void 0 ? void 0 : res.isDeleted);
        }
        catch (err) {
            console.error("Error during task delete:", err);
        }
        process.exit(0);
    });
}
run();
