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
exports.deleteWorkspace = exports.leaveWorkspace = exports.changeWorkspaceRole = exports.removeUserFromWorkspace = exports.addUserToWorkspace = exports.updateWorkspace = exports.getUserWorkspaces = exports.getWorkspaceById = exports.createWorkspace = void 0;
const workspace_model_1 = __importDefault(require("../model/workspace.model"));
const project_model_1 = __importDefault(require("../model/project.model"));
const notification_model_1 = __importDefault(require("../model/notification.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const notification_service_1 = require("./notification.service");
// CREATE WORKSPACE
const createWorkspace = (_a) => __awaiter(void 0, [_a], void 0, function* ({ name, description, owner, }) {
    const workspace = yield workspace_model_1.default.create({
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
});
exports.createWorkspace = createWorkspace;
// GET WORKSPACE BY ID
const getWorkspaceById = (workspaceId) => __awaiter(void 0, void 0, void 0, function* () {
    const workspace = yield workspace_model_1.default.findById(workspaceId)
        .populate("owner")
        .populate("members.user");
    if (!workspace) {
        throw new Error("Workspace not found");
    }
    workspace.members = workspace.members.filter((member) => member.status !== "pending");
    return workspace;
});
exports.getWorkspaceById = getWorkspaceById;
// GET USER WORKSPACES
const getUserWorkspaces = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Delete any personal workspaces and their projects
    const personalWorkspaces = yield workspace_model_1.default.find({
        owner: userId,
        name: { $in: ["Personal Tasks Workspace", "Personal Workspace"] }
    });
    if (personalWorkspaces.length > 0) {
        const personalIds = personalWorkspaces.map(w => w._id);
        yield project_model_1.default.deleteMany({ workspace: { $in: personalIds } });
        yield workspace_model_1.default.deleteMany({ _id: { $in: personalIds } });
    }
    const workspaces = yield workspace_model_1.default.find({
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
});
exports.getUserWorkspaces = getUserWorkspaces;
// UPDATE WORKSPACE
const updateWorkspace = (_a) => __awaiter(void 0, [_a], void 0, function* ({ workspaceId, name, description, logoUrl, }) {
    const workspace = yield workspace_model_1.default.findById(workspaceId);
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
    yield workspace.save();
    return workspace;
});
exports.updateWorkspace = updateWorkspace;
// ADD MEMBER
const addUserToWorkspace = (workspaceId, userId, inviterId //optional, to specify who is inviting (admin or owner
) => __awaiter(void 0, void 0, void 0, function* () {
    const workspace = yield workspace_model_1.default.findById(workspaceId);
    if (!workspace) {
        throw new Error("Workspace not found");
    }
    const existingMember = workspace.members.find((member) => member.user.toString() === userId);
    if ((existingMember === null || existingMember === void 0 ? void 0 : existingMember.status) === "joined") {
        throw new Error("User already exists in workspace");
    }
    if ((existingMember === null || existingMember === void 0 ? void 0 : existingMember.status) === "pending") {
        throw new Error("Workspace invitation already pending");
    }
    const pendingInvite = yield notification_model_1.default.findOne({
        recipient: userId,
        workspace: workspace._id,
        type: "WORKSPACE_INVITE",
        inviteStatus: "pending",
    });
    if (pendingInvite) {
        throw new Error("Workspace invitation already pending");
    }
    yield (0, notification_service_1.createNotification)({
        recipient: userId,
        sender: inviterId || workspace.owner.toString(),
        type: "WORKSPACE_INVITE",
        title: "Workspace Invitation",
        message: `You have been invited to join the workspace: "${workspace.name}"`,
        link: `/workspaces/${workspace._id}`,
        workspace: workspace._id,
        inviteStatus: "pending",
    });
    yield (0, notification_service_1.notifyWorkspaceManagers)(workspace._id, inviterId || workspace.owner.toString(), {
        type: "WORKSPACE_INVITE_SENT",
        title: "Workspace Invite Sent",
        message: `An invitation was sent for workspace "${workspace.name}"`,
        link: `/workspaces/${workspace._id}`,
    });
    const refreshed = yield workspace_model_1.default.findById(workspace._id)
        .populate("owner")
        .populate("members.user");
    if (refreshed) {
        refreshed.members = refreshed.members.filter((member) => member.status !== "pending");
        return refreshed;
    }
    return workspace;
});
exports.addUserToWorkspace = addUserToWorkspace;
// REMOVE MEMBER
const removeUserFromWorkspace = (workspaceId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const workspace = yield workspace_model_1.default.findById(workspaceId);
    if (!workspace) {
        throw new Error("Workspace not found");
    }
    workspace.members = workspace.members.filter((member) => member.user.toString() !== userId);
    yield workspace.save();
    yield project_model_1.default.updateMany({
        workspace: workspaceId,
    }, {
        $pull: {
            members: { user: new mongoose_1.default.Types.ObjectId(userId) },
        },
    });
    return workspace;
});
exports.removeUserFromWorkspace = removeUserFromWorkspace;
// CHANGE ROLE
const changeWorkspaceRole = (workspaceId, userId, role) => __awaiter(void 0, void 0, void 0, function* () {
    const workspace = yield workspace_model_1.default.findById(workspaceId);
    if (!workspace) {
        throw new Error("Workspace not found");
    }
    const member = workspace.members.find((member) => member.user.toString() === userId);
    if (!member) {
        throw new Error("Member not found");
    }
    member.role = role;
    yield workspace.save();
    return workspace;
});
exports.changeWorkspaceRole = changeWorkspaceRole;
// LEAVE WORKSPACE
const leaveWorkspace = (workspaceId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const workspace = yield workspace_model_1.default.findById(workspaceId);
    if (!workspace) {
        throw new Error("Workspace not found");
    }
    if (workspace.owner.toString() === userId) {
        throw new Error("Owner cannot leave workspace");
    }
    workspace.members = workspace.members.filter((member) => member.user.toString() !== userId);
    yield workspace.save();
    yield project_model_1.default.updateMany({ workspace: workspaceId }, { $pull: { members: { user: new mongoose_1.default.Types.ObjectId(userId) } } });
    return workspace;
});
exports.leaveWorkspace = leaveWorkspace;
// DELETE WORKSPACE
const deleteWorkspace = (workspaceId) => __awaiter(void 0, void 0, void 0, function* () {
    const workspace = yield workspace_model_1.default.findById(workspaceId);
    if (!workspace) {
        throw new Error("Workspace not found");
    }
    yield project_model_1.default.deleteMany({
        workspace: workspaceId,
    });
    yield workspace_model_1.default.findByIdAndDelete(workspaceId);
    return {
        message: "Workspace deleted successfully",
    };
});
exports.deleteWorkspace = deleteWorkspace;
