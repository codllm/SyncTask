import express from "express";
import {
  getTodosController,
  createTodoController,
  updateTodoController,
  deleteTodoController,
} from "../controllers/todo.controller";
import { userauth } from "../middleware/auth.middleware";

const router = express.Router();

router.get("/", userauth, getTodosController);
router.post("/", userauth, createTodoController);
router.put("/:todoId", userauth, updateTodoController);
router.delete("/:todoId", userauth, deleteTodoController);

export default router;
