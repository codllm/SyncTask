import { Router } from "express";
import { userauth } from "../middleware/auth.middleware";
import { usersearch } from "../controllers/searchUser.controller";

const router = Router();
router.get("/user/suggestion/:qurey", userauth, usersearch);

export default router;