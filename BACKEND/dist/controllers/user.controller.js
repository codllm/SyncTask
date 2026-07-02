"use strict";
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
exports.updateThemeColorController = exports.removePushTokenController = exports.registerPushTokenController = exports.appleAuth = exports.googleAuth = exports.deleteSavedFilterController = exports.getSavedFiltersController = exports.saveFilterController = exports.updateAvatarController = exports.getPinnedItemsController = exports.togglePinTaskController = exports.togglePinProjectController = exports.updatePreferences = exports.logout = exports.forgetPass = exports.updateUserProfile = exports.profile = exports.login = exports.signup = void 0;
const express_validator_1 = require("express-validator");
const user_service_1 = require("../services/user.service"); // Named import
const user_model_1 = __importDefault(require("../model/user.model"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const fs_1 = __importDefault(require("fs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { username: { firstname, lastname }, email, password, gender, usertype, phone } = req.body;
    try {
        const newUser = yield (0, user_service_1.createUser)({ firstname, lastname, email, password, gender, usertype, phone });
        const token = newUser.generateToken();
        console.log("New user created:", newUser); // Debugging log
        return res.status(201).json({ success: true, user: newUser, token });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
exports.signup = signup;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    const user = yield user_model_1.default.findOne({ email });
    if (!user) {
        return res.status(401).json({
            message: "Invalid credentials"
        });
    }
    const passwordMatch = yield user.comparePassword(password);
    console.log("Password Match:", passwordMatch);
    if (!passwordMatch) {
        return res.status(401).json({ message: "Incorrect Password" });
    }
    //match found, generate token now
    const token = user.generateToken();
    return res.status(200).json({ success: true, user, token });
});
exports.login = login;
const profile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return res.status(200).json({
            user: req.user,
        });
    }
    catch (err) {
        return res.status(500).json({
            message: "Server error",
        });
    }
});
exports.profile = profile;
const updateUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { username, firstname, lastname, phone, age, gender } = req.body;
        const update = {};
        const nextFirstname = (_b = username === null || username === void 0 ? void 0 : username.firstname) !== null && _b !== void 0 ? _b : firstname;
        const nextLastname = (_c = username === null || username === void 0 ? void 0 : username.lastname) !== null && _c !== void 0 ? _c : lastname;
        if (nextFirstname !== undefined)
            update["username.firstname"] = String(nextFirstname).trim();
        if (nextLastname !== undefined)
            update["username.lastname"] = String(nextLastname).trim();
        if (age !== undefined)
            update.age = age;
        if (gender !== undefined)
            update.gender = gender;
        if (phone !== undefined) {
            const parsedPhone = Number(phone);
            if (Number.isNaN(parsedPhone)) {
                return res.status(400).json({ success: false, message: "Phone must be a number" });
            }
            update.phone = parsedPhone;
        }
        if (Object.keys(update).length === 0) {
            return res.status(400).json({ success: false, message: "No profile fields provided" });
        }
        const updatedUser = yield user_model_1.default.findByIdAndUpdate(userId, { $set: update }, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        return res.status(200).json({ success: true, user: updatedUser });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});
exports.updateUserProfile = updateUserProfile;
const forgetPass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, newPassword } = req.body;
    // Implment password reset logic here (e.g., send reset email)
    const userforget = yield (0, user_service_1.forgetPassword)(email, newPassword); // Example new password, replace with actual logic
    return res.status(200).json({ message: `Password reset link sent to ${email}` });
});
exports.forgetPass = forgetPass;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1]; // Extract token from header
    if (!token) {
        return res.status(400).json({ success: false, message: "Token is required for logout" });
    }
    console.log("Logout token:", token); // Debugging log
    return res.status(200).json({ success: true, message: "Logged out successfully" });
});
exports.logout = logout;
const updatePreferences = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    try {
        const userId = req.user._id;
        const { comments, assignments, mentions, reminders } = req.body;
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        user.notificationPreferences = {
            comments: comments !== undefined ? comments : ((_b = (_a = user.notificationPreferences) === null || _a === void 0 ? void 0 : _a.comments) !== null && _b !== void 0 ? _b : true),
            assignments: assignments !== undefined ? assignments : ((_d = (_c = user.notificationPreferences) === null || _c === void 0 ? void 0 : _c.assignments) !== null && _d !== void 0 ? _d : true),
            mentions: mentions !== undefined ? mentions : ((_f = (_e = user.notificationPreferences) === null || _e === void 0 ? void 0 : _e.mentions) !== null && _f !== void 0 ? _f : true),
            reminders: reminders !== undefined ? reminders : ((_h = (_g = user.notificationPreferences) === null || _g === void 0 ? void 0 : _g.reminders) !== null && _h !== void 0 ? _h : true),
        };
        yield user.save();
        return res.status(200).json({
            success: true,
            user,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update notification preferences",
        });
    }
});
exports.updatePreferences = updatePreferences;
const togglePinProjectController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const { projectId } = req.params;
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (!user.pinnedProjects) {
            user.pinnedProjects = [];
        }
        const index = user.pinnedProjects.indexOf(projectId);
        if (index > -1) {
            user.pinnedProjects.splice(index, 1);
        }
        else {
            user.pinnedProjects.push(projectId);
        }
        yield user.save();
        return res.status(200).json({ success: true, pinnedProjects: user.pinnedProjects });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Failed to toggle pin project" });
    }
});
exports.togglePinProjectController = togglePinProjectController;
const togglePinTaskController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const { taskId } = req.params;
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (!user.pinnedTasks) {
            user.pinnedTasks = [];
        }
        const index = user.pinnedTasks.indexOf(taskId);
        if (index > -1) {
            user.pinnedTasks.splice(index, 1);
        }
        else {
            user.pinnedTasks.push(taskId);
        }
        yield user.save();
        return res.status(200).json({ success: true, pinnedTasks: user.pinnedTasks });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Failed to toggle pin task" });
    }
});
exports.togglePinTaskController = togglePinTaskController;
const getPinnedItemsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const user = yield user_model_1.default.findById(userId)
            .populate({
            path: "pinnedProjects",
            match: { isDeleted: { $ne: true } }
        })
            .populate({
            path: "pinnedTasks",
            match: { isDeleted: { $ne: true } },
            populate: [
                { path: "assignedTo", select: "username email" },
                { path: "createdBy", select: "username email" }
            ]
        });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const populatedProjects = (user.pinnedProjects || []);
        const populatedTasks = (user.pinnedTasks || []);
        const pinnedProjectsFiltered = populatedProjects.filter(p => p !== null);
        const pinnedTasksFiltered = populatedTasks.filter(t => t !== null);
        // Self-healing: if any pinned items were deleted and populated as null, clean up DB
        let needsUpdate = false;
        if (pinnedProjectsFiltered.length !== populatedProjects.length) {
            user.pinnedProjects = pinnedProjectsFiltered.map((p) => p._id);
            needsUpdate = true;
        }
        if (pinnedTasksFiltered.length !== populatedTasks.length) {
            user.pinnedTasks = pinnedTasksFiltered.map((t) => t._id);
            needsUpdate = true;
        }
        if (needsUpdate) {
            yield user.save();
        }
        return res.status(200).json({
            success: true,
            pinnedProjects: pinnedProjectsFiltered,
            pinnedTasks: pinnedTasksFiltered,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Failed to fetch pinned items" });
    }
});
exports.getPinnedItemsController = getPinnedItemsController;
const updateAvatarController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }
        // Upload file to Cloudinary
        const result = yield cloudinary_1.default.uploader.upload(req.file.path, {
            folder: "user-avatars",
            resource_type: "image",
        });
        // Remove local temp file
        fs_1.default.unlink(req.file.path, (err) => {
            if (err)
                console.error("Failed to delete local temp avatar file:", err);
        });
        // Update user avatarUrl in database
        const user = yield user_model_1.default.findByIdAndUpdate(userId, { avatarUrl: result.secure_url }, { new: true });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        return res.status(200).json({
            success: true,
            message: "Avatar updated successfully",
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl,
                pinnedProjects: user.pinnedProjects,
                pinnedTasks: user.pinnedTasks,
                notificationPreferences: user.notificationPreferences
            }
        });
    }
    catch (error) {
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlink(req.file.path, () => { });
        }
        return res.status(500).json({ success: false, message: error.message || "Failed to update avatar" });
    }
});
exports.updateAvatarController = updateAvatarController;
const saveFilterController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const { projectId, filterName, query } = req.body;
        if (!projectId || !filterName || !query) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (!user.savedFilters)
            user.savedFilters = [];
        user.savedFilters.push({
            name: filterName,
            project: projectId,
            query
        });
        yield user.save();
        return res.status(200).json({
            success: true,
            message: "Filter saved successfully",
            savedFilters: user.savedFilters
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Failed to save filter" });
    }
});
exports.saveFilterController = saveFilterController;
const getSavedFiltersController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const { projectId } = req.params;
        if (!projectId) {
            return res.status(400).json({ success: false, message: "Project ID is required" });
        }
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const filters = (user.savedFilters || []).filter(f => f.project.toString() === projectId);
        return res.status(200).json({
            success: true,
            savedFilters: filters
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Failed to fetch saved filters" });
    }
});
exports.getSavedFiltersController = getSavedFiltersController;
const deleteSavedFilterController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const { filterId } = req.params;
        if (!filterId) {
            return res.status(400).json({ success: false, message: "Filter ID is required" });
        }
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (user.savedFilters) {
            user.savedFilters = user.savedFilters.filter(f => f._id.toString() !== filterId);
            yield user.save();
        }
        return res.status(200).json({
            success: true,
            message: "Saved filter deleted successfully"
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Failed to delete saved filter" });
    }
});
exports.deleteSavedFilterController = deleteSavedFilterController;
const googleAuth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { idToken, profile } = req.body;
    try {
        let email;
        let firstname;
        let lastname;
        let googleId;
        let avatarUrl;
        if (idToken) {
            // Real Google token verification
            const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
            const response = yield fetch(verifyUrl);
            if (!response.ok) {
                return res.status(400).json({ success: false, message: "Invalid Google ID token" });
            }
            const tokenInfo = yield response.json();
            email = tokenInfo.email;
            firstname = tokenInfo.given_name || "Google";
            lastname = tokenInfo.family_name || "User";
            googleId = tokenInfo.sub;
            avatarUrl = tokenInfo.picture;
        }
        else if (profile) {
            // Simulated profile (for development/testing/simulator)
            if (process.env.NODE_ENV === "production") {
                return res.status(400).json({ success: false, message: "Simulated profiles are not allowed in production mode. A valid token is required." });
            }
            email = profile.email;
            firstname = profile.firstname || "Google";
            lastname = profile.lastname || "User";
            googleId = profile.googleId;
            avatarUrl = profile.avatarUrl;
        }
        else {
            return res.status(400).json({ success: false, message: "Missing Google authentication data" });
        }
        if (!email || !googleId) {
            return res.status(400).json({ success: false, message: "Required user info not found in Google profile" });
        }
        // Find or create user
        let user = yield user_model_1.default.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });
        if (!user) {
            // Create new user
            user = new user_model_1.default({
                username: { firstname, lastname },
                email: email.toLowerCase(),
                gender: "not_specified",
                usertype: "individual",
                googleId,
                avatarUrl: avatarUrl || "",
                phone: 1234567890 // Temporary dummy phone number
            });
            yield user.save();
        }
        else if (!user.googleId) {
            // Link Google account to existing email account
            user.googleId = googleId;
            if (avatarUrl && !user.avatarUrl) {
                user.avatarUrl = avatarUrl;
            }
            yield user.save();
        }
        const token = user.generateToken();
        return res.status(200).json({ success: true, user, token });
    }
    catch (error) {
        console.error("Google Auth Error:", error);
        return res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
});
exports.googleAuth = googleAuth;
const appleAuth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { identityToken, profile } = req.body;
    try {
        let email;
        let firstname;
        let lastname;
        let appleId;
        if (identityToken) {
            // Decode Apple ID Token
            const decoded = jsonwebtoken_1.default.decode(identityToken);
            if (!decoded) {
                return res.status(400).json({ success: false, message: "Invalid Apple identity token" });
            }
            email = decoded.email;
            appleId = decoded.sub;
            firstname = "Apple";
            lastname = "User";
            // If user profile is sent (Apple only sends name on the very first authentication)
            if (profile && profile.username) {
                firstname = profile.username.firstname || firstname;
                lastname = profile.username.lastname || lastname;
            }
        }
        else if (profile) {
            // Simulated profile (for development/testing/simulator)
            if (process.env.NODE_ENV === "production") {
                return res.status(400).json({ success: false, message: "Simulated profiles are not allowed in production mode. A valid token is required." });
            }
            email = profile.email;
            firstname = profile.firstname || "Apple";
            lastname = profile.lastname || "User";
            appleId = profile.appleId;
        }
        else {
            return res.status(400).json({ success: false, message: "Missing Apple authentication data" });
        }
        if (!email || !appleId) {
            return res.status(400).json({ success: false, message: "Required user info not found in Apple profile" });
        }
        // Find or create user
        let user = yield user_model_1.default.findOne({ $or: [{ appleId }, { email: email.toLowerCase() }] });
        if (!user) {
            // Create new user
            user = new user_model_1.default({
                username: { firstname, lastname },
                email: email.toLowerCase(),
                gender: "not_specified",
                usertype: "individual",
                appleId,
                avatarUrl: "",
                phone: 1234567890 // Temporary dummy phone number
            });
            yield user.save();
        }
        else if (!user.appleId) {
            // Link Apple account to existing email account
            user.appleId = appleId;
            yield user.save();
        }
        const token = user.generateToken();
        return res.status(200).json({ success: true, user, token });
    }
    catch (error) {
        console.error("Apple Auth Error:", error);
        return res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
});
exports.appleAuth = appleAuth;
const registerPushTokenController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { pushToken } = req.body;
        if (!pushToken) {
            return res.status(400).json({ success: false, message: "Push token is required" });
        }
        if (!user.pushTokens) {
            user.pushTokens = [];
        }
        if (!user.pushTokens.includes(pushToken)) {
            user.pushTokens.push(pushToken);
            yield user.save();
        }
        return res.status(200).json({ success: true, message: "Push token registered successfully" });
    }
    catch (error) {
        console.error("Register Push Token Error:", error);
        return res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
});
exports.registerPushTokenController = registerPushTokenController;
const removePushTokenController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { pushToken } = req.body;
        if (!pushToken) {
            return res.status(400).json({ success: false, message: "Push token is required" });
        }
        if (user.pushTokens) {
            user.pushTokens = user.pushTokens.filter((token) => token !== pushToken);
            yield user.save();
        }
        return res.status(200).json({ success: true, message: "Push token removed successfully" });
    }
    catch (error) {
        console.error("Remove Push Token Error:", error);
        return res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
});
exports.removePushTokenController = removePushTokenController;
const updateThemeColorController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const { themeColor } = req.body;
        if (!themeColor) {
            return res.status(400).json({ success: false, message: "themeColor is required" });
        }
        const updatedUser = yield user_model_1.default.findByIdAndUpdate(userId, { $set: { themeColor } }, { new: true });
        return res.status(200).json({ success: true, user: updatedUser });
    }
    catch (error) {
        console.error("Update Theme Color Error:", error);
        return res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
});
exports.updateThemeColorController = updateThemeColorController;
