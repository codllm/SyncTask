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
exports.deleteTodoController = exports.updateTodoController = exports.createTodoController = exports.getTodosController = void 0;
const todo_model_1 = __importDefault(require("../model/todo.model"));
const getTodosController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const todos = yield todo_model_1.default.find({ user: userId }).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            todos,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch todos",
        });
    }
});
exports.getTodosController = getTodosController;
const createTodoController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const { title, status, priority, description } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Title is required",
            });
        }
        const todo = yield todo_model_1.default.create({
            user: userId,
            title: title.trim(),
            status: status || "todo",
            priority: priority || "low",
            description: description || "",
        });
        return res.status(201).json({
            success: true,
            todo,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to create todo",
        });
    }
});
exports.createTodoController = createTodoController;
const updateTodoController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const { todoId } = req.params;
        const { title, status, priority, description } = req.body;
        const todo = yield todo_model_1.default.findOne({ _id: todoId, user: userId });
        if (!todo) {
            return res.status(404).json({
                success: false,
                message: "Todo not found",
            });
        }
        if (title !== undefined)
            todo.title = title.trim();
        if (status !== undefined)
            todo.status = status;
        if (priority !== undefined)
            todo.priority = priority;
        if (description !== undefined)
            todo.description = description;
        yield todo.save();
        return res.status(200).json({
            success: true,
            todo,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update todo",
        });
    }
});
exports.updateTodoController = updateTodoController;
const deleteTodoController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const { todoId } = req.params;
        const result = yield todo_model_1.default.deleteOne({ _id: todoId, user: userId });
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Todo not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Todo deleted successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete todo",
        });
    }
});
exports.deleteTodoController = deleteTodoController;
