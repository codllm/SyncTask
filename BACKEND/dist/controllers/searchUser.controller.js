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
exports.workspaceSearch = exports.searchProject = exports.usersearch = void 0;
const searchUser_service_1 = require("../services/searchUser.service");
const usersearch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = String(req.params.query || "");
        const searchResult = yield (0, searchUser_service_1.userSuggestion)(query);
        return res.status(200).json(searchResult);
    }
    catch (error) {
        return res.status(500).json({ message: error.message || "Internal Server Error" });
    }
});
exports.usersearch = usersearch;
const searchProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = String(req.params.query || "");
        const searchResult = yield (0, searchUser_service_1.projectSuggestion)(query);
        return res.status(200).json(searchResult);
    }
    catch (error) {
        return res.status(500).json({ message: error.message || "Internal Server Error" });
    }
});
exports.searchProject = searchProject;
const workspaceSearch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = String(req.params.query || "");
        const searchResult = yield (0, searchUser_service_1.workspaceSuggestion)(query);
        return res.status(200).json(searchResult);
    }
    catch (error) {
        return res.status(500).json({ message: error.message || "Internal Server Error" });
    }
});
exports.workspaceSearch = workspaceSearch;
