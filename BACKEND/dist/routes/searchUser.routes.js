"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const searchUser_controller_1 = require("../controllers/searchUser.controller");
const router = (0, express_1.Router)();
// Suggestions for user selection (based on email)
router.get("/user/suggestion/:query", auth_middleware_1.userauth, searchUser_controller_1.usersearch);
// Suggestions for projects (based on name)
router.get("/project/suggestion/:query", auth_middleware_1.userauth, searchUser_controller_1.searchProject);
// Suggestions for workspaces (based on name)
router.get("/workspace/suggestion/:query", auth_middleware_1.userauth, searchUser_controller_1.workspaceSearch);
exports.default = router;
