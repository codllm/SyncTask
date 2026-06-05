"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitToProject = exports.emitToUser = exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io = null;
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: "*", // Adjust for specific frontend origins in production
            methods: ["GET", "POST", "PUT", "DELETE"],
            credentials: true,
        },
    });
    io.on("connection", (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);
        // Join a user-specific room for receiving personal notifications
        socket.on("join:user", (userId) => {
            if (userId) {
                socket.join(userId);
                console.log(`👤 User ${userId} joined their personal room`);
            }
        });
        // Join a project-specific room for task board updates
        socket.on("join:project", (projectId) => {
            if (projectId) {
                socket.join(projectId);
                console.log(`📂 User joined project room: ${projectId}`);
            }
        });
        // Leave a project-specific room
        socket.on("leave:project", (projectId) => {
            if (projectId) {
                socket.leave(projectId);
                console.log(`🚪 User left project room: ${projectId}`);
            }
        });
        socket.on("disconnect", () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io) {
        throw new Error("Socket.io has not been initialized!");
    }
    return io;
};
exports.getIO = getIO;
/**
 * Send real-time notification to a specific user
 */
const emitToUser = (userId, event, data) => {
    if (io) {
        io.to(userId).emit(event, data);
        console.log(`📤 Emitted ${event} to user room: ${userId}`);
    }
};
exports.emitToUser = emitToUser;
/**
 * Send real-time updates to all members active on a project board
 */
const emitToProject = (projectId, event, data) => {
    if (io) {
        io.to(projectId).emit(event, data);
        console.log(`📤 Emitted ${event} to project room: ${projectId}`);
    }
};
exports.emitToProject = emitToProject;
