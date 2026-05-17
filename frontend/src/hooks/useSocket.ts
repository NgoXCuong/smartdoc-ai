import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3000";

export const useSocket = (userId: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    console.log("[Socket] Initializing connection to:", SOCKET_URL);
    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["polling", "websocket"], // Polling first is often more reliable for initial handshake
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("[Socket] Connected with ID:", newSocket.id);
      console.log("[Socket] Emitting join for userId:", userId);
      newSocket.emit("join", userId);
    });

    newSocket.on("joined", (data) => {
      console.log("[Socket] Successfully joined room:", data.room);
    });

    newSocket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [userId]);

  return socket;
};
