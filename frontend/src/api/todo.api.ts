import api from "./user.api";

export interface Todo {
  _id: string;
  title: string;
  status: "todo" | "completed";
  priority: "low" | "medium" | "high";
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const getTodos = async () => {
  const response = await api.get("/api/todos");
  return response.data;
};

export const createTodo = async (data: {
  title: string;
  status?: "todo" | "completed";
  priority?: "low" | "medium" | "high";
  description?: string;
}) => {
  const response = await api.post("/api/todos", data);
  return response.data;
};

export const updateTodo = async (
  todoId: string,
  data: {
    title?: string;
    status?: "todo" | "completed";
    priority?: "low" | "medium" | "high";
    description?: string;
  }
) => {
  const response = await api.put(`/api/todos/${todoId}`, data);
  return response.data;
};

export const deleteTodo = async (todoId: string) => {
  const response = await api.delete(`/api/todos/${todoId}`);
  return response.data;
};
