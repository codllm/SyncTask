
import Workspace from "../model/workspace.model";
import Project from "../model/project.model";
import mongoose from "mongoose";
import { createNotification } from "./notification.service";
import { seedDemoWorkspacesForUser } from "./demo.service";
import User from "../model/user.model";

interface CreateWorkspacePayload {
  name: string;
  description?: string;
  owner: string;
}


// CREATE WORKSPACE

export const createWorkspace = async ({
  name,
  description,
  owner,
}: CreateWorkspacePayload) => {

  const workspace = await Workspace.create({
    name,
    description,
    owner,

    members: [
      {
        user: owner,
        role: "owner",
      },
    ],
  });

  return workspace;
};


// GET WORKSPACE BY ID
export const getWorkspaceById = async (
  workspaceId: string
) => {

  const workspace = await Workspace.findById(workspaceId)
    .populate("owner")
    .populate("members.user");

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  return workspace;
};


// GET USER WORKSPACES

export const getUserWorkspaces = async (
  userId: string
) => {
  // Delete any personal workspaces and their projects
  const personalWorkspaces = await Workspace.find({
    owner: userId,
    name: { $in: ["Personal Tasks Workspace", "Personal Workspace"] }
  });
  if (personalWorkspaces.length > 0) {
    const personalIds = personalWorkspaces.map(w => w._id);
    await Project.deleteMany({ workspace: { $in: personalIds } });
    await Workspace.deleteMany({ _id: { $in: personalIds } });
  }

  let workspaces = await Workspace.find({
    members: {
      $elemMatch: {
        user: userId,
        status: { $ne: "pending" },
      },
    },
  })
    .populate("owner")
    .populate("members.user");

  if (workspaces.length === 0) {
    // Check if the user has already had their demo workspaces seeded
    const user = await User.findById(userId);
    if (user && !user.demoSeeded) {
      // Automatically seed two dummy workspaces with projects/tasks for first-time or empty users!
      await seedDemoWorkspacesForUser(userId);
      user.demoSeeded = true;
      await user.save();

      // Refetch the newly created demo workspaces
      workspaces = await Workspace.find({
        members: {
          $elemMatch: {
            user: userId,
            status: { $ne: "pending" },
          },
        },
      })
        .populate("owner")
        .populate("members.user");
    }
  }

  return workspaces;
};


interface UpdateWorkspacePayload {
  workspaceId: string;
  name?: string;
  description?: string;
  logoUrl?: string;
}


// UPDATE WORKSPACE

export const updateWorkspace = async ({
  workspaceId,
  name,
  description,
  logoUrl,
}: UpdateWorkspacePayload) => {

  const workspace = await Workspace.findById(
    workspaceId
  );

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  if (name) {
    workspace.name = name;
  }

  if (description) {
    workspace.description = description;
  }

  if (logoUrl !== undefined) {
    workspace.logoUrl = logoUrl;
  }

  await workspace.save();

  return workspace;
};


// ADD MEMBER

export const addUserToWorkspace = async (
  workspaceId: string,
  userId: string,
  inviterId?: string //optional, to specify who is inviting (admin or owner
) => {

  const workspace = await Workspace.findById(
    workspaceId
  );

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const isMember = workspace.members.some(
    (member) =>
      member.user.toString() === userId
  );

  if (isMember) {
    throw new Error("User already exists");
  }

  workspace.members.push({
    user: new mongoose.Types.ObjectId(userId),
    role: "member",
    status: "pending",
  });

  await workspace.save();

  await createNotification({
    recipient: userId,
    sender: inviterId || workspace.owner.toString(),
    type: "WORKSPACE_INVITE",
    title: "Workspace Invitation",
    message: `You have been invited to join the workspace: "${workspace.name}"`,
    link: `/workspaces/${workspace._id}`,
    workspace: workspace._id,
    inviteStatus: "pending",
  });

  return workspace;
};


// REMOVE MEMBER

export const removeUserFromWorkspace = async (
  workspaceId: string,
  userId: string
) => {

  const workspace = await Workspace.findById(
    workspaceId
  );

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  workspace.members = workspace.members.filter(
    (member) =>
      member.user.toString() !== userId
  );

  await workspace.save();

  await Project.updateMany(
    {
      workspace: workspaceId,
    },
    {
      $pull: {
        members: userId,
      },
    }
  );

  return workspace;
};


// CHANGE ROLE

export const changeWorkspaceRole = async (
  workspaceId: string,
  userId: string,
  role: "admin" | "member"
) => {

  const workspace = await Workspace.findById(
    workspaceId
  );

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const member = workspace.members.find(
    (member) =>
      member.user.toString() === userId
  );

  if (!member) {
    throw new Error("Member not found");
  }

  member.role = role;

  await workspace.save();

  return workspace;
};


// LEAVE WORKSPACE

export const leaveWorkspace = async (
  workspaceId: string,
  userId: string
) => {

  const workspace = await Workspace.findById(
    workspaceId
  );

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  if (
    workspace.owner.toString() === userId
  ) {
    throw new Error(
      "Owner cannot leave workspace"
    );
  }

  workspace.members = workspace.members.filter(
    (member) =>
      member.user.toString() !== userId
  );

  await workspace.save();

  return workspace;
};


// DELETE WORKSPACE

export const deleteWorkspace = async (
  workspaceId: string
) => {

  const workspace = await Workspace.findById(
    workspaceId
  );

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  await Project.deleteMany({
    workspace: workspaceId,
  });

  await Workspace.findByIdAndDelete(
    workspaceId
  );

  return {
    message: "Workspace deleted successfully",
  };
};