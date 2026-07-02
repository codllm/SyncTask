"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ai_controller_1 = require("../controllers/ai.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.post("/task-draft", auth_middleware_1.userauth, ai_controller_1.generateTaskDraftController);
router.post("/task-summary", auth_middleware_1.userauth, ai_controller_1.generateTaskSummaryController);
router.post("/comment-rewrite", auth_middleware_1.userauth, ai_controller_1.rewriteCommentController);
exports.default = router;
