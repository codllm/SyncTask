"use strict";
// controllers/workspace.controller.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWorkspaceController = exports.leaveWorkspaceController = exports.changeWorkspaceRoleController = exports.removeUserFromWorkspaceController = exports.addUserToWorkspaceController = exports.updateWorkspaceController = exports.getUserWorkspacesController = exports.getWorkspaceByIdController = exports.createWorkspaceController = void 0;
const workspace_service_1 = require("../services/workspace.service");
// CREATE WORKSPACE
const createWorkspaceController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const workspace = yield (0, workspace_service_1.createWorkspace)(Object.assign(Object.assign({}, req.body), { owner: user._id }));
        res.status(201).json({
            success: true,
            workspace,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.createWorkspaceController = createWorkspaceController;
// GET WORKSPACE BY ID
const getWorkspaceByIdController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const workspace = yield (0, workspace_service_1.getWorkspaceById)(req.params.workspaceId);
        res.status(200).json({
            success: true,
            workspace,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.getWorkspaceByIdController = getWorkspaceByIdController;
// GET USER WORKSPACES
const getUserWorkspacesController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const workspaces = yield (0, workspace_service_1.getUserWorkspaces)(req.params.userId);
        res.status(200).json({
            success: true,
            workspaces,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.getUserWorkspacesController = getUserWorkspacesController;
// UPDATE WORKSPACE
const updateWorkspaceController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const workspace = yield (0, workspace_service_1.updateWorkspace)(Object.assign({ workspaceId: req.params.workspaceId }, req.body));
        res.status(200).json({
            success: true,
            workspace,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.updateWorkspaceController = updateWorkspaceController;
// ADD MEMBER
const addUserToWorkspaceController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const workspace = yield (0, workspace_service_1.addUserToWorkspace)(req.params.workspaceId, req.body.userId);
        res.status(200).json({
            success: true,
            workspace,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.addUserToWorkspaceController = addUserToWorkspaceController;
// REMOVE MEMBER
const removeUserFromWorkspaceController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const workspace = yield (0, workspace_service_1.removeUserFromWorkspace)(req.params.workspaceId, req.body.userId);
        res.status(200).json({
            success: true,
            workspace,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.removeUserFromWorkspaceController = removeUserFromWorkspaceController;
// CHANGE ROLE
const changeWorkspaceRoleController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const workspace = yield (0, workspace_service_1.changeWorkspaceRole)(req.params.workspaceId, req.body.userId, req.body.role);
        res.status(200).json({
            success: true,
            workspace,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.changeWorkspaceRoleController = changeWorkspaceRoleController;
// LEAVE WORKSPACE
const leaveWorkspaceController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const workspace = yield (0, workspace_service_1.leaveWorkspace)(req.params.workspaceId, user._id);
        res.status(200).json({
            success: true,
            workspace,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.leaveWorkspaceController = leaveWorkspaceController;
// DELETE WORKSPACE
const deleteWorkspaceController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, workspace_service_1.deleteWorkspace)(req.params.workspaceId);
        res.status(200).json({
            success: true,
            result,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.deleteWorkspaceController = deleteWorkspaceController;
