"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const comment_controller_1 = require("../controllers/comment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const workspace_middleware_1 = require("../middleware/workspace.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const comment_validator_1 = require("../validator/comment.validator");
const router = express_1.default.Router();
// Add comment to a task (accessible to project members)
router.post("/task/:taskId", auth_middleware_1.userauth, workspace_middleware_1.isProjectMember, (0, validate_middleware_1.validate)(comment_validator_1.createCommentSchema), comment_controller_1.createCommentController);
// Get all comments for a task (accessible to project members)
router.get("/task/:taskId", auth_middleware_1.userauth, workspace_middleware_1.isProjectMember, comment_controller_1.getTaskCommentsController);
// Delete comment (accessible to project members)
router.delete("/:commentId", auth_middleware_1.userauth, workspace_middleware_1.isProjectMember, comment_controller_1.deleteCommentController);
exports.default = router;
