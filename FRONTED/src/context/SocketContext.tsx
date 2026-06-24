import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useApp } from "./AppContext";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.4:5137";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, token, activeProject } = useApp();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const previousProjectRef = useRef<string | null>(null);

  useEffect(() => {
    // Only connect if user and token exist
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    console.log("SocketContext: Initializing connection to", BASE_URL);
    
    // Connect to server
    const socketInstance = io(BASE_URL, {
      transports: ["websocket"],
      auth: {
        token, // Pass token in case backend wants to authenticate in middleware later
      },
    });

    socketInstance.on("connect", () => {
      console.log("SocketContext: Connected to server, socket ID:", socketInstance.id);
      setIsConnected(true);
      
      // Join user room
      socketInstance.emit("join-user-room", user._id);
      
      // Re-join active project if we have one
      if (activeProject?._id) {
        socketInstance.emit("join-project-room", activeProject._id);
        previousProjectRef.current = activeProject._id;
      }
    });

    socketInstance.on("disconnect", () => {
      console.log("SocketContext: Disconnected from server");
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("SocketContext: Connection error:", err);
    });

    setSocket(socketInstance);

    return () => {
      console.log("SocketContext: Cleaning up and disconnecting socket");
      socketInstance.disconnect();
      previousProjectRef.current = null;
    };
  }, [token, user?._id]); // Re-create socket when token or user ID changes

  // Handle project room joining/leaving
  useEffect(() => {
    if (!socket || !isConnected) return;

    const currentProjectId = activeProject?._id || null;
    const previousProjectId = previousProjectRef.current;

    if (currentProjectId !== previousProjectId) {
      // Leave previous project room
      if (previousProjectId) {
        socket.emit("leave-project-room", previousProjectId);
      }

      // Join new project room
      if (currentProjectId) {
        socket.emit("join-project-room", currentProjectId);
      }

      previousProjectRef.current = currentProjectId;
    }
  }, [activeProject?._id, socket, isConnected]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
