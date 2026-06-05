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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectMembersController = exports.changeProjectRoleController = exports.removeMemberFromProjectController = exports.addMemberToProjectController = exports.deleteProjectController = exports.updateProjectController = exports.getWorkspaceProjectsController = exports.getProjectByIdController = exports.createProjectController = void 0;
const project_service_1 = require("../services/project.service");
// CREATE PROJECT
const createProjectController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const project = yield (0, project_service_1.createProject)(Object.assign(Object.assign({}, req.body), { createdBy: user._id }));
        res.status(201).json({
            success: true,
            project,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.createProjectController = createProjectController;
// GET PROJECT BY ID
const getProjectByIdController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = yield (0, project_service_1.getProjectById)(req.params.projectId);
        res.status(200).json({
            success: true,
            project,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.getProjectByIdController = getProjectByIdController;
// GET WORKSPACE PROJECTS
const getWorkspaceProjectsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projects = yield (0, project_service_1.getWorkspaceProjects)(req.params.workspaceId);
        res.status(200).json({
            success: true,
            projects,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.getWorkspaceProjectsController = getWorkspaceProjectsController;
// UPDATE PROJECT
const updateProjectController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = yield (0, project_service_1.updateProject)(Object.assign({ projectId: req.params.projectId }, req.body));
        res.status(200).json({
            success: true,
            project,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.updateProjectController = updateProjectController;
// DELETE PROJECT
const deleteProjectController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, project_service_1.deleteProject)(req.params.projectId);
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
exports.deleteProjectController = deleteProjectController;
// ADD MEMBER TO PROJECT
const addMemberToProjectController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = yield (0, project_service_1.addMemberToProject)(req.params.projectId, req.body.userId);
        res.status(200).json({
            success: true,
            project,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.addMemberToProjectController = addMemberToProjectController;
// REMOVE MEMBER FROM PROJECT
const removeMemberFromProjectController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = yield (0, project_service_1.removeMemberFromProject)(req.params.projectId, req.body.userId);
        res.status(200).json({
            success: true,
            project,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.removeMemberFromProjectController = removeMemberFromProjectController;
// CHANGE PROJECT ROLE
const changeProjectRoleController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = yield (0, project_service_1.changeProjectRole)(req.params.projectId, req.body.userId, req.body.role);
        res.status(200).json({
            success: true,
            project,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.changeProjectRoleController = changeProjectRoleController;
// GET PROJECT MEMBERS
const getProjectMembersController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const members = yield (0, project_service_1.getProjectMembers)(req.params.projectId);
        res.status(200).json({
            success: true,
            members,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.getProjectMembersController = getProjectMembersController;
