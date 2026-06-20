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
exports.uploadFileController = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const fs_1 = __importDefault(require("fs"));
const uploadFileController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded",
            });
        }
        // Upload to Cloudinary
        const result = yield cloudinary_1.default.uploader.upload(req.file.path, {
            folder: "task-project-management-attachments",
            resource_type: "auto",
        });
        // Clean up local temp file asynchronously
        fs_1.default.unlink(req.file.path, (err) => {
            if (err)
                console.error("Failed to delete local temp file:", err);
        });
        res.status(200).json({
            success: true,
            url: result.secure_url,
            name: req.file.originalname,
            fileType: req.file.mimetype,
        });
    }
    catch (error) {
        // Clean up local file if upload failed
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlink(req.file.path, () => { });
        }
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.uploadFileController = uploadFileController;
