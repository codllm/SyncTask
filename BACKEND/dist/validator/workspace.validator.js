"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWorkspaceSchema = exports.addWorkspaceMemberSchema = exports.createWorkspaceSchema = void 0;
const zod_1 = require("zod");
exports.createWorkspaceSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(3),
    description: zod_1.z
        .string()
        .optional(),
});
exports.addWorkspaceMemberSchema = zod_1.z.object({
    userId: zod_1.z
        .string(),
    role: zod_1.z.enum([
        "owner",
        "admin",
        "member",
    ]),
});
exports.updateWorkspaceSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .optional(),
    description: zod_1.z
        .string()
        .optional(),
});
