import express from "express";
import {
  generateTaskDraftController,
  generateTaskSummaryController,
  rewriteCommentController,
} from "../controllers/ai.controller";
import { userauth } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/task-draft", userauth, generateTaskDraftController);
router.post("/task-summary", userauth, generateTaskSummaryController);
router.post("/comment-rewrite", userauth, rewriteCommentController);

export default router;
