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
import { workspaceApi, notificationApi } from "@/services/api";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3000";

interface NotificationItem {
  _id: string;
  recipientId: string;
  senderId?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  metadata?: any;
  createdAt: string;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  totalUnreadMessages: number;
  unreadByWorkspace: Record<string, number>;
  fetchNotifications: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  markWorkspaceAsRead: (workspaceId: string) => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  totalUnreadMessages: 0,
  unreadByWorkspace: {},
  fetchNotifications: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  deleteNotification: () => {},
  markWorkspaceAsRead: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadByWorkspace, setUnreadByWorkspace] = useState<Record<string, number>>({});
  const socketRef = useRef<Socket | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const joinedRoomsRef = useRef<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationApi.getAll(1, 20);
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (e) {
      console.error("[Notification] Lỗi lấy thông báo:", e);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error("[Notification] Lỗi đánh dấu đã đọc:", e);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error("[Notification] Lỗi đánh dấu tất cả đã đọc:", e);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const item = notifications.find((n) => n._id === id);
      await notificationApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (item && !item.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error("[Notification] Lỗi xóa thông báo:", e);
    }
  }, [notifications]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // Clear workspace message badge when navigating into workspace chat
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

    const socket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
      transports: ["polling", "websocket"],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", async () => {
      socket.emit("join", userId);

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
        console.error("[Notification] Không thể tải workspace list:", e);
      }
    });

    // Lắng nghe sự kiện notification_new realtime
    socket.on("notification_new", (newNotif: NotificationItem) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Pop-up Toast realtime
      toast.custom(
        (t) => (
          <div
            onClick={() => {
              toast.dismiss(t.id);
              if (newNotif.link) router.push(newNotif.link);
            }}
            className={`max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 cursor-pointer hover:bg-slate-50 transition-all ${
              t.visible ? "animate-enter" : "animate-leave"
            }`}
          >
            <div className="flex-1 w-0">
              <div className="flex items-start">
                <div className="ml-3 flex-1">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    {newNotif.title}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800 line-clamp-2">
                    {newNotif.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ),
        { duration: 5000 }
      );
    });

    // Lắng nghe tin nhắn mới từ workspace chat
    socket.on("workspace_new_message", ({ message, workspaceId }) => {
      if (!workspaceId) return;

      const currentMatch = window.location.pathname.match(
        /^\/workspaces\/([^/]+)\/chat/
      );
      if (currentMatch && currentMatch[1] === workspaceId) return;

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
  }, [router]);

  const markWorkspaceAsRead = useCallback((workspaceId: string) => {
    setUnreadByWorkspace((prev) => {
      if (!prev[workspaceId]) return prev;
      const next = { ...prev };
      delete next[workspaceId];
      return next;
    });
  }, []);

  const totalUnreadMessages = Object.values(unreadByWorkspace).reduce(
    (sum, n) => sum + n,
    0
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        totalUnreadMessages,
        unreadByWorkspace,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        markWorkspaceAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
