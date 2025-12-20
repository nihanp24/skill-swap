import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useUser } from "./UserContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useUser();
  const [socket, setSocket] = useState(null);
  const SOCKET_SERVER_URL =
    import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

  useEffect(() => {
    if (!user?._id) return;

    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    newSocket.on("connect", () => {
      console.log("🟢 Connected to Socket.io:", newSocket.id);
      newSocket.emit("join_room", user._id);
    });

    newSocket.on("reconnect", (attempt) => {
      console.log(`🔁 Reconnected after ${attempt} attempts`);
      newSocket.emit("join_room", user._id);
    });

    newSocket.on("disconnect", () => {
      console.log("🔴 Disconnected from Socket.io server");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
