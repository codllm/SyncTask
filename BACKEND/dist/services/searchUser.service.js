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
exports.workspaceSuggestion = exports.projectSuggestion = exports.userSuggestion = void 0;
const user_model_1 = __importDefault(require("../model/user.model"));
const project_model_1 = __importDefault(require("../model/project.model"));
const workspace_model_1 = __importDefault(require("../model/workspace.model"));
const userSuggestion = (query) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const searchResult = yield user_model_1.default.find({
            email: {
                $regex: query,
                $options: "i",
            },
        })
            .select("username email")
            .limit(15);
        return searchResult;
    }
    catch (error) {
        console.error("Error searching for users:", error);
        throw new Error("Failed to search for users");
    }
});
exports.userSuggestion = userSuggestion;
const projectSuggestion = (query) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const searchResult = yield project_model_1.default.find({
            name: {
                $regex: query,
                $options: "i",
            },
        })
            .select("name")
            .limit(10);
        return searchResult;
    }
    catch (error) {
        console.error("Error searching for projects:", error);
        throw new Error("Failed to search for projects");
    }
});
exports.projectSuggestion = projectSuggestion;
const workspaceSuggestion = (query) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const searchResult = yield workspace_model_1.default.find({
            name: {
                $regex: query,
                $options: "i",
            },
        })
            .select("name")
            .limit(10);
        return searchResult;
    }
    catch (error) {
        console.error("Error searching for workspaces:", error);
        throw new Error("Failed to search for workspaces");
    }
});
exports.workspaceSuggestion = workspaceSuggestion;
