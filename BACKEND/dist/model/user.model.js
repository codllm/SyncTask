"use strict";
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
const mongoose_1 = __importStar(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt")); // Fixed typo in import
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
//  Pass both IUser and the custom methods type to the Schema definition
const UserSchema = new mongoose_1.Schema({
    username: {
        firstname: {
            type: String,
            required: true,
            trim: true,
        },
        lastname: {
            type: String,
            required: true,
            trim: true,
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: false,
        minlength: 3,
    },
    age: {
        type: Number,
        required: false,
    },
    gender: {
        type: String,
        required: false,
        default: "not_specified",
    },
    usertype: {
        type: String,
        required: true,
        enum: ["individual", "team", "admin"],
        default: "individual",
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    appleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    phone: {
        type: Number,
        required: false,
    },
    notificationPreferences: {
        comments: { type: Boolean, default: true },
        assignments: { type: Boolean, default: true },
        mentions: { type: Boolean, default: true },
        reminders: { type: Boolean, default: true },
    },
    pinnedProjects: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Project",
        },
    ],
    pinnedTasks: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Task",
        },
    ],
    avatarUrl: {
        type: String,
        default: "",
    },
    savedFilters: [
        {
            name: { type: String, required: true },
            project: { type: mongoose_1.Schema.Types.ObjectId, ref: "Project", required: true },
            query: {
                assignee: { type: String, default: null },
                priority: { type: String, default: null },
                dueDate: { type: String, default: null },
                label: { type: String, default: null },
                sortBy: { type: String, default: "position" },
                sortOrder: { type: String, default: "asc" },
            },
        },
    ],
    pushTokens: [{ type: String }],
    themeColor: {
        type: String,
        default: "#6366F1",
    },
    demoSeeded: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
UserSchema.methods.hashPassword = function (password) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcrypt_1.default.hash(password, 10);
    });
};
UserSchema.methods.comparePassword = function (password) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.password)
            return false;
        return yield bcrypt_1.default.compare(password, this.password);
    });
};
UserSchema.methods.generateToken = function () {
    const secret = process.env.JWT_SECRET_KEY || 'your-fallback-secret';
    return jsonwebtoken_1.default.sign({ id: this._id }, secret, { expiresIn: '1d' });
};
// 5. Create and export the model
const User = mongoose_1.default.model('User', UserSchema);
exports.default = User;
