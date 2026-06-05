import TaskModel from "../model/task.model";
import { createNotification } from "./notification.service";
import { emitToProject } from "./socket";

export const createTaskService = async (data: any) => {
  const task = await TaskModel.create(data);
  const populatedTask = await TaskModel.findById(task._id)
    .populate("assignedTo", "username email")
    .populate("createdBy", "username email");

  if (!populatedTask) {
    throw new Error("Failed to populate created task");
  }

  emitToProject(populatedTask.project.toString(), "task:created", populatedTask);

  if (
    populatedTask.assignedTo &&
    populatedTask.assignedTo._id.toString() !== populatedTask.createdBy._id.toString()
  ) {
    await createNotification({
      recipient: populatedTask.assignedTo._id.toString(),
      sender: populatedTask.createdBy._id.toString(),
      type: "TASK_ASSIGNED",
      title: "New Task Assigned",
      message: `You have been assigned to the task: "${populatedTask.title}"`,
      link: `/projects/${populatedTask.project}/tasks/${populatedTask._id}`,
    });
  }

  return populatedTask;
};

export const getProjectTasksService = async (
  projectId: string
) => {

  return await TaskModel.find({
    project: projectId,
  })
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email");
};

export const getSingleTaskService = async (
  taskId: string
) => {

  return await TaskModel.findById(taskId)
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email");
};

export const updateTaskService = async (taskId: string, data: any, updaterId?: string) => {
  const originalTask = await TaskModel.findById(taskId);
  if (!originalTask) {
    throw new Error("Task not found");
  }

  const { newAttachments, ...updateData } = data;

  let updateQuery: any = { $set: updateData };
  if (newAttachments && newAttachments.length > 0) {
    updateQuery.$push = { attachments: { $each: newAttachments } };
  }

  const updatedTask = await TaskModel.findByIdAndUpdate(taskId, updateQuery, { new: true })
    .populate("assignedTo", "username email")
    .populate("createdBy", "username email");

  if (!updatedTask) {
    throw new Error("Task not found");
  }

  emitToProject(updatedTask.project.toString(), "task:updated", updatedTask);

  if (
    data.assignedTo &&
    (!originalTask.assignedTo || originalTask.assignedTo.toString() !== data.assignedTo.toString())
  ) {
    await createNotification({
      recipient: data.assignedTo,
      sender: updaterId || updatedTask.createdBy._id.toString(),
      type: "TASK_ASSIGNED",
      title: "New Task Assigned",
      message: `You have been assigned to the task: "${updatedTask.title}"`,
      link: `/projects/${updatedTask.project}/tasks/${updatedTask._id}`,
    });
  } else if (
    originalTask.assignedTo &&
    originalTask.assignedTo.toString() !== updaterId &&
    originalTask.assignedTo.toString() === updatedTask.assignedTo?._id?.toString()
  ) {
    await createNotification({
      recipient: originalTask.assignedTo.toString(),
      sender: updaterId || updatedTask.createdBy._id.toString(),
      type: "TASK_UPDATED",
      title: "Task Updated",
      message: `The task: "${updatedTask.title}" assigned to you was updated`,
      link: `/projects/${updatedTask.project}/tasks/${updatedTask._id}`,
    });
  }

  return updatedTask;
};

export const deleteTaskService = async (
  taskId: string
) => {

  const task = await TaskModel.findByIdAndDelete(taskId);
  
  if (task) {
    emitToProject(task.project.toString(), "task:deleted", { taskId });
  }

  return task;
};