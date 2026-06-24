import { Request, Response } from "express";
import Todo from "../model/todo.model";

export const getTodosController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const todos = await Todo.find({ user: userId }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      todos,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch todos",
    });
  }
};

export const createTodoController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { title, status, priority, description } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    const todo = await Todo.create({
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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create todo",
    });
  }
};

export const updateTodoController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { todoId } = req.params;
    const { title, status, priority, description } = req.body;

    const todo = await Todo.findOne({ _id: todoId, user: userId });
    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

    if (title !== undefined) todo.title = title.trim();
    if (status !== undefined) todo.status = status;
    if (priority !== undefined) todo.priority = priority;
    if (description !== undefined) todo.description = description;

    await todo.save();

    return res.status(200).json({
      success: true,
      todo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update todo",
    });
  }
};

export const deleteTodoController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { todoId } = req.params;

    const result = await Todo.deleteOne({ _id: todoId, user: userId });
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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete todo",
    });
  }
};
