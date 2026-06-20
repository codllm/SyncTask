"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const activity_controller_1 = require("../controllers/activity.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.get("/workspace/:workspaceId", auth_middleware_1.userauth, activity_controller_1.getWorkspaceActivitiesController);
exports.default = router;
