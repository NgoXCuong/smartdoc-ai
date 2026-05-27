"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import { workspaceApi } from "@/services/api";
import { usePathname } from "next/navigation";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3000";

interface NotificationContextValue {
  // Tổng số tin nhắn chưa đọc trên tất cả workspace
  totalUnread: number;
  // Số tin nhắn chưa đọc theo từng workspaceId
  unreadByWorkspace: Record<string, number>;
  // Gọi khi user mở trang chat của workspace → reset count
  markWorkspaceAsRead: (workspaceId: string) => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  totalUnread: 0,
  unreadByWorkspace: {},
  markWorkspaceAsRead: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadByWorkspace, setUnreadByWorkspace] = useState<Record<string, number>>({});
  const socketRef = useRef<Socket | null>(null);
  const pathname = usePathname();
  const joinedRoomsRef = useRef<Set<string>>(new Set());

  // Khi user vào trang chat của workspace nào → auto clear badge đó
  useEffect(() => {
    const match = pathname?.match(/^\/workspaces\/([^/]+)\/chat/);
    if (match) {
      const wsId = match[1];
      markWorkspaceAsRead(wsId);
    }
  }, [pathname]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const userRaw = localStorage.getItem("user");
    if (!token || !userRaw) return;

    const user = JSON.parse(userRaw);
    const userId = user._id || user.id;
    if (!userId) return;

    // Khởi tạo socket với JWT auth
    const socket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
      transports: ["polling", "websocket"],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", async () => {
      // Join personal room (document progress)
      socket.emit("join", userId);

      // Lấy danh sách workspace và join tất cả các room
      try {
        const res = await workspaceApi.getAll();
        const workspaces: any[] = res.data.workspaces || [];
        workspaces.forEach((ws) => {
          const wsId = ws._id;
          if (!joinedRoomsRef.current.has(wsId)) {
            socket.emit("join_workspace", wsId);
            joinedRoomsRef.current.add(wsId);
          }
        });
      } catch (e) {
        // Không làm gián đoạn nếu API lỗi
        console.error("[Notification] Không thể tải workspace list:", e);
      }
    });

    // Lắng nghe tin nhắn mới từ TẤT CẢ workspace room đã join
    socket.on("workspace_new_message", ({ message, workspaceId }) => {
      if (!workspaceId) return;

      // Nếu đang mở trang chat đó → không tăng badge
      const currentMatch = window.location.pathname.match(
        /^\/workspaces\/([^/]+)\/chat/
      );
      if (currentMatch && currentMatch[1] === workspaceId) return;

      // Bỏ qua tin nhắn của chính mình
      const myUser = JSON.parse(localStorage.getItem("user") || "{}");
      const myId = myUser._id || myUser.id;
      if (message?.senderId?._id === myId || message?.senderId === myId) return;

      setUnreadByWorkspace((prev) => ({
        ...prev,
        [workspaceId]: (prev[workspaceId] || 0) + 1,
      }));
    });

    socket.on("disconnect", () => {
      joinedRoomsRef.current.clear();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      joinedRoomsRef.current.clear();
    };
  }, []); // Chỉ chạy 1 lần khi mount

  const markWorkspaceAsRead = useCallback((workspaceId: string) => {
    setUnreadByWorkspace((prev) => {
      if (!prev[workspaceId]) return prev;
      const next = { ...prev };
      delete next[workspaceId];
      return next;
    });
  }, []);

  const totalUnread = Object.values(unreadByWorkspace).reduce(
    (sum, n) => sum + n,
    0
  );

  return (
    <NotificationContext.Provider
      value={{ totalUnread, unreadByWorkspace, markWorkspaceAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
