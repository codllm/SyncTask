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
exports.logout = exports.forgetPass = exports.updateUserProfile = exports.profile = exports.login = exports.signup = void 0;
const user_service_1 = require("../services/user.service");
const user_model_1 = __importDefault(require("../model/user.model"));
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username: { firstname, lastname }, email, password, age, gender, usertype, phone, } = req.body;
    try {
        const newUser = yield (0, user_service_1.createUser)({
            firstname,
            lastname,
            email,
            password,
            age,
            gender,
            usertype,
            phone,
        });
        const token = newUser.generateToken();
        // Set secure HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            sameSite: "strict",
        });
        return res.status(201).json({
            success: true,
            user: newUser,
            token,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});
exports.signup = signup;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield user_model_1.default.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }
        const passwordMatch = yield user.comparePassword(password);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Incorrect Password",
            });
        }
        const token = user.generateToken();
        // Set secure HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            sameSite: "strict",
        });
        return res.status(200).json({
            success: true,
            user,
            token,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});
exports.login = login;
const profile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return res.status(200).json({
            success: true,
            user: req.user,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});
exports.profile = profile;
const updateUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, phone } = req.body;
    try {
        const updatedUser = yield (0, user_service_1.updateUser)({ email, phone });
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
    const { email, newPassword } = req.body;
    try {
        yield (0, user_service_1.forgetPassword)(email, newPassword);
        return res.status(200).json({
            success: true,
            message: "Password reset successfully",
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});
exports.forgetPass = forgetPass;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.clearCookie("token");
        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});
exports.logout = logout;
