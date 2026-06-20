"use strict";
// models/project.model.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const projectSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
    },
    description: {
        type: String,
    },
    color: {
        type: String,
        default: "#6C63FF",
    },
    coverImageUrl: {
        type: String,
    },
    workspace: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Workspace",
        required: true,
    },
    members: [
        {
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            role: {
                type: String,
                enum: ["admin", "member", "viewer"],
                default: "member",
            },
        },
    ],
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    status: {
        type: String,
        enum: ["ACTIVE", "COMPLETED", "ARCHIVED"],
        default: "ACTIVE",
    },
    deadline: {
        type: Date,
    },
    columns: {
        type: [
            {
                id: { type: String, required: true },
                label: { type: String, required: true },
                color: { type: String, default: "#6C63FF" }
            }
        ],
        default: [
            { id: "todo", label: "To Do", color: "#A8ACB9" },
            { id: "in-progress", label: "In Progress", color: "#EF9F27" },
            { id: "completed", label: "Completed", color: "#5DCAA5" }
        ]
    },
    customFields: {
        type: [
            {
                name: { type: String, required: true },
                type: { type: String, enum: ["text", "number", "date", "boolean"], default: "text" },
                required: { type: Boolean, default: false }
            }
        ],
        default: []
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true,
    },
    deletedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
exports.default = mongoose_1.default.model("Project", projectSchema);
