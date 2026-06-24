import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";

let io: Server;
const userSockets = new Map<string, string>(); // Map<UserId, SocketId>

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("Client connected via Socket.io:", socket.id);

    // User joins their personal room
    socket.on("join-user-room", (userId: string) => {
      socket.join(`user:${userId}`);
      userSockets.set(userId, socket.id);
      
      // Broadcast that this user is online
      io.emit("user:online", { userId });
      console.log(`User ${userId} joined their personal room`);
    });

    // User joins a project room (for live kanban updates)
    socket.on("join-project-room", (projectId: string) => {
      socket.join(`project:${projectId}`);
      console.log(`Socket ${socket.id} joined project room: ${projectId}`);
    });

    // User leaves a project room when switching projects
    socket.on("leave-project-room", (projectId: string) => {
      socket.leave(`project:${projectId}`);
      console.log(`Socket ${socket.id} left project room: ${projectId}`);
    });

    // Handle typing indicators
    socket.on("typing:start", (data: { projectId: string, userId: string, taskId?: string }) => {
      socket.to(`project:${data.projectId}`).emit("typing:started", data);
    });

    socket.on("typing:stop", (data: { projectId: string, userId: string, taskId?: string }) => {
      socket.to(`project:${data.projectId}`).emit("typing:stopped", data);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      // Remove from online mapping
      for (const [userId, sockId] of userSockets.entries()) {
        if (sockId === socket.id) {
          userSockets.delete(userId);
          io.emit("user:offline", { userId });
          break;
        }
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToProject = (projectId: string, event: string, data: any) => {
  if (io) {
    io.to(`project:${projectId}`).emit(event, data);
  }
};
