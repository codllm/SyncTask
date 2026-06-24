"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const todo_controller_1 = require("../controllers/todo.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.get("/", auth_middleware_1.userauth, todo_controller_1.getTodosController);
router.post("/", auth_middleware_1.userauth, todo_controller_1.createTodoController);
router.put("/:todoId", auth_middleware_1.userauth, todo_controller_1.updateTodoController);
router.delete("/:todoId", auth_middleware_1.userauth, todo_controller_1.deleteTodoController);
exports.default = router;
