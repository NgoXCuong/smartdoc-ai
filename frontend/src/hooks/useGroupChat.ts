"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { groupChatApi } from "@/services/api";
import { toast } from "react-hot-toast";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3000";

export interface GroupMessage {
  _id: string;
  workspaceId: string;
  senderId: { _id: string; username: string; email: string; avatar?: string } | null;
  content: string;
  type: "text" | "ai_response";
  aiMentioned: boolean;
  isDeleted: boolean;
  sources?: { docId: string; fileName: string; pageNumber: number }[];
  createdAt: string;
  // Gán thêm phía client cho AI message không có senderId
  senderName?: string;
}

export interface TypingUser {
  userId: string;
  isTyping: boolean;
}

export function useGroupChat(workspaceId: string | null) {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [typingUsers, setTypingUsers] = useState<Map<string, boolean>>(new Map());
  const [isAITyping, setIsAITyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ── Kết nối Socket & Join Workspace Room ──────────────────────────────────
  useEffect(() => {
    if (!workspaceId) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token: `${token}` },
      withCredentials: true,
      transports: ["polling", "websocket"],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join_workspace", workspaceId);
      // Cũng join personal room để document progress vẫn hoạt động
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user._id || user.id) {
        socket.emit("join", user._id || user.id);
      }
    });

    socket.on("workspace_joined", () => {
      console.log("[GroupChat] Đã tham gia workspace room:", workspaceId);
    });

    socket.on("workspace_new_message", ({ message }: { message: GroupMessage }) => {
      // Tắt AI typing indicator khi nhận được message
      if (message.type === "ai_response") {
        setIsAITyping(false);
      }
      setMessages((prev) => {
        // Tránh duplicate messages
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    });

    socket.on("workspace_ai_typing", () => {
      setIsAITyping(true);
    });

    socket.on("workspace_user_typing", ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const myId = currentUser._id || currentUser.id;
      if (userId === myId) return; // Bỏ qua typing của chính mình

      setTypingUsers((prev) => {
        const next = new Map(prev);
        if (isTyping) {
          next.set(userId, true);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });

    socket.on("workspace_member_joined", ({ userId }: { userId: string }) => {
      console.log("[GroupChat] Thành viên vừa tham gia:", userId);
    });

    socket.on("error", ({ message }: { message: string }) => {
      toast.error(message);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("[GroupChat] Socket lỗi kết nối:", err.message);
      setIsConnected(false);
    });

    return () => {
      socket.emit("leave_workspace", workspaceId);
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setMessages([]);
      setTypingUsers(new Map());
      setIsAITyping(false);
    };
  }, [workspaceId]);

  // ── Load lịch sử tin nhắn từ REST API ─────────────────────────────────────
  const loadHistory = useCallback(
    async (page = 1) => {
      if (!workspaceId) return;
      setIsLoading(true);
      try {
        const res = await groupChatApi.getHistory(workspaceId, page, 30);
        const { messages: newMessages, hasMore: more } = res.data;
        if (page === 1) {
          setMessages(newMessages);
        } else {
          // Khi load thêm (scroll lên trên) → prepend
          setMessages((prev) => [...newMessages, ...prev]);
        }
        setHasMore(more);
        setCurrentPage(page);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Không thể tải lịch sử chat");
      } finally {
        setIsLoading(false);
      }
    },
    [workspaceId]
  );

  useEffect(() => {
    if (workspaceId) {
      loadHistory(1);
    }
  }, [workspaceId, loadHistory]);

  // ── Gửi tin nhắn qua Socket ────────────────────────────────────────────────
  const sendMessage = useCallback(
    (content: string) => {
      if (!socketRef.current || !workspaceId || !content.trim()) return;
      // Dừng typing indicator
      socketRef.current.emit("workspace_typing", { workspaceId, isTyping: false });
      socketRef.current.emit("workspace_message", { workspaceId, content: content.trim() });
    },
    [workspaceId]
  );

  // ── Typing Indicator với debounce ──────────────────────────────────────────
  const emitTyping = useCallback(() => {
    if (!socketRef.current || !workspaceId) return;
    socketRef.current.emit("workspace_typing", { workspaceId, isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("workspace_typing", { workspaceId, isTyping: false });
    }, 2000);
  }, [workspaceId]);

  // ── Xóa tin nhắn ──────────────────────────────────────────────────────────
  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!workspaceId) return;
      try {
        await groupChatApi.deleteMessage(workspaceId, messageId);
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId
              ? { ...m, content: "Tin nhắn đã bị xóa", isDeleted: true }
              : m
          )
        );
        toast.success("Đã xóa tin nhắn");
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Không thể xóa tin nhắn");
      }
    },
    [workspaceId]
  );

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      loadHistory(currentPage + 1);
    }
  }, [hasMore, isLoading, currentPage, loadHistory]);

  return {
    messages,
    isLoading,
    hasMore,
    typingUsers,
    isAITyping,
    isConnected,
    sendMessage,
    emitTyping,
    deleteMessage,
    loadMore,
  };
}
