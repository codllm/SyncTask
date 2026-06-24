import userModel from "../model/user.model";
import projectModel from "../model/project.model";
import workspaceModel from "../model/workspace.model";
import TaskModel from "../model/task.model";
import mongoose from "mongoose";

export const searchUsersService = async (query: string) => {
  try {
    return await userModel
      .find({
        $or: [
          { email: { $regex: query, $options: "i" } },
          { "username.firstname": { $regex: query, $options: "i" } },
          { "username.lastname": { $regex: query, $options: "i" } },
        ],
      })
      .select("username email profilePic")
      .limit(15);
  } catch (error) {
    console.error("Error searching for users:", error);
    throw new Error("Failed to search for users");
  }
};

export const searchWorkspacesService = async (query: string, userId: string) => {
  try {
    return await workspaceModel
      .find({
        name: { $regex: query, $options: "i" },
        members: {
          $elemMatch: {
            user: new mongoose.Types.ObjectId(userId),
            status: { $ne: "pending" }
          }
        }
      })
      .select("name description")
      .limit(10);
  } catch (error) {
    console.error("Error searching for workspaces:", error);
    throw new Error("Failed to search for workspaces");
  }
};

export const searchProjectsService = async (query: string, userId: string) => {
  try {
    return await projectModel
      .find({
        name: { $regex: query, $options: "i" },
        "members.user": new mongoose.Types.ObjectId(userId),
      })
      .select("name status deadline workspace")
      .populate("workspace", "name")
      .limit(10);
  } catch (error) {
    console.error("Error searching for projects:", error);
    throw new Error("Failed to search for projects");
  }
};

export const searchTasksService = async (query: string, userId: string) => {
  try {
    // A user can search tasks if they are assigned to it, OR if they are a member of the project it belongs to.
    // First, find all projects the user is a member of.
    const userProjects = await projectModel.find({ "members.user": new mongoose.Types.ObjectId(userId) }).select("_id");
    const projectIds = userProjects.map((p) => p._id);

    return await TaskModel.find({
      title: { $regex: query, $options: "i" },
      $or: [
        { project: { $in: projectIds } },
        { assignedTo: new mongoose.Types.ObjectId(userId) },
      ],
    })
      .select("title status priority project")
      .populate("project", "name")
      .limit(15);
  } catch (error) {
    console.error("Error searching for tasks:", error);
    throw new Error("Failed to search for tasks");
  }
};