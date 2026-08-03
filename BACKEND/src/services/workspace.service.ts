
import Workspace from "../model/workspace.model";
import Project from "../model/project.model";
import Notification from "../model/notification.model";
import mongoose from "mongoose";
import { createNotification, notifyWorkspaceManagers } from "./notification.service";

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

  workspace.members = workspace.members.filter((member) => member.status !== "pending");

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

  const workspaces = await Workspace.find({
    members: {
      $elemMatch: {
        user: userId,
        status: { $ne: "pending" },
      },
    },
  })
    .populate("owner")
    .populate("members.user");

  for (const workspace of workspaces) {
    workspace.members = workspace.members.filter((member) => member.status !== "pending");
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

  const existingMember = workspace.members.find(
    (member) => member.user.toString() === userId
  );

  if (existingMember?.status === "joined") {
    throw new Error("User already exists in workspace");
  }

  if (existingMember?.status === "pending") {
    throw new Error("Workspace invitation already pending");
  }

  const pendingInvite = await Notification.findOne({
    recipient: userId,
    workspace: workspace._id,
    type: "WORKSPACE_INVITE",
    inviteStatus: "pending",
  });

  if (pendingInvite) {
    throw new Error("Workspace invitation already pending");
  }

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

  await notifyWorkspaceManagers(workspace._id, inviterId || workspace.owner.toString(), {
    type: "WORKSPACE_INVITE_SENT",
    title: "Workspace Invite Sent",
    message: `An invitation was sent for workspace "${workspace.name}"`,
    link: `/workspaces/${workspace._id}`,
  });

  const refreshed = await Workspace.findById(workspace._id)
    .populate("owner")
    .populate("members.user");

  if (refreshed) {
    refreshed.members = refreshed.members.filter((member) => member.status !== "pending");
    return refreshed;
  }

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
        members: { user: new mongoose.Types.ObjectId(userId) },
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

  await Project.updateMany(
    { workspace: workspaceId },
    { $pull: { members: { user: new mongoose.Types.ObjectId(userId) } } }
  );

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
