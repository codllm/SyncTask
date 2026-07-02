import express from "express";
import { generateTaskDraftController } from "../controllers/ai.controller";
import { userauth } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/task-draft", userauth, generateTaskDraftController);

export default router;
