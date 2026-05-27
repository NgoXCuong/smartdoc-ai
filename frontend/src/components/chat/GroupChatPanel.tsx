"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  Trash2,
  ChevronUp,
  Wifi,
  WifiOff,
  Info,
  Sparkles,
} from "lucide-react";
import { useGroupChat, GroupMessage } from "@/hooks/useGroupChat";
import { cn } from "@/lib/utils";

interface GroupChatPanelProps {
  workspaceId: string;
  workspaceName: string;
  currentUserId: string;
}

export default function GroupChatPanel({
  workspaceId,
  workspaceName,
  currentUserId,
}: GroupChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const {
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
  } = useGroupChat(workspaceId);

  // Auto-scroll xuống cuối khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAITyping]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    emitTyping();
  };

  const typingCount = typingUsers.size;

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm leading-tight">
              #{workspaceName}
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">
              Group Chat · Hỗ trợ @AI
            </p>
          </div>
        </div>

        {/* Connection Status */}
        <div
          className={cn(
            "flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full",
            isConnected
              ? "text-emerald-600 bg-emerald-50"
              : "text-slate-400 bg-slate-100"
          )}
        >
          {isConnected ? (
            <Wifi size={11} />
          ) : (
            <WifiOff size={11} />
          )}
          {isConnected ? "Trực tuyến" : "Đang kết nối..."}
        </div>
      </div>

      {/* ── AI Hint Banner ─────────────────────────────────────────────────── */}
      <div className="px-4 py-2 bg-indigo-50/70 border-b border-indigo-100/50 flex items-center gap-2 shrink-0">
        <Sparkles size={12} className="text-indigo-500 shrink-0" />
        <p className="text-[11px] text-indigo-600 font-medium">
          Gõ <code className="bg-indigo-100 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">@AI [câu hỏi]</code>{" "}
          để hỏi AI về tài liệu trong workspace
        </p>
      </div>

      {/* ── Messages List ──────────────────────────────────────────────────── */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scroll-smooth"
      >
        {/* Load More button */}
        {hasMore && (
          <div className="flex justify-center mb-4">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors font-medium disabled:opacity-50"
            >
              <ChevronUp size={12} />
              {isLoading ? "Đang tải..." : "Xem tin nhắn cũ hơn"}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
              <Bot size={24} className="text-indigo-400" />
            </div>
            <p className="text-slate-500 font-semibold text-sm">
              Chưa có tin nhắn nào
            </p>
            <p className="text-slate-400 text-xs mt-1 max-w-xs">
              Hãy là người đầu tiên gửi tin nhắn trong workspace này!
            </p>
          </div>
        )}

        {/* Message Items */}
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => (
            <MessageBubble
              key={msg._id}
              message={msg}
              isOwn={
                msg.senderId !== null &&
                (msg.senderId as any)?._id === currentUserId
              }
              showAvatar={
                index === 0 ||
                messages[index - 1]?.senderId?._id !== msg.senderId?._id ||
                messages[index - 1]?.type !== msg.type
              }
              onDelete={deleteMessage}
            />
          ))}
        </AnimatePresence>

        {/* AI Typing Indicator */}
        <AnimatePresence>
          {isAITyping && (
            <motion.div
              key="ai-typing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex items-end gap-2.5"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                <Bot size={13} className="text-white" />
              </div>
              <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
                <span className="text-xs text-slate-400 ml-1 font-medium">
                  AI đang phân tích tài liệu...
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Human Typing Indicator */}
        <AnimatePresence>
          {typingCount > 0 && (
            <motion.div
              key="typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[11px] text-slate-400 font-medium px-1 pb-1"
            >
              {typingCount === 1 ? "Một thành viên đang gõ..." : `${typingCount} thành viên đang gõ...`}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Box ─────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-slate-100 bg-white shrink-0">
        <div className="flex items-end gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isConnected
                ? "Nhắn tin... (Shift+Enter để xuống dòng)"
                : "Đang kết nối..."
            }
            disabled={!isConnected}
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-slate-700 placeholder:text-slate-400 max-h-32 min-h-[20px] leading-relaxed disabled:opacity-50"
            style={{ height: "auto" }}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 128) + "px";
            }}
          />
          <button
            onClick={handleSend}
            disabled={!isConnected || !inputValue.trim()}
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 mb-0.5",
              inputValue.trim() && isConnected
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            )}
          >
            <Send size={14} />
          </button>
        </div>

        {/* @AI hint shortcut */}
        {inputValue.trim() && !inputValue.includes("@AI") && (
          <motion.button
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={() => setInputValue(`@AI ${inputValue}`)}
            className="mt-2 flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
          >
            <Sparkles size={10} />
            Hỏi AI về nội dung này?
          </motion.button>
        )}
      </div>
    </div>
  );
}

// ─── MessageBubble Component ─────────────────────────────────────────────────
interface MessageBubbleProps {
  message: GroupMessage;
  isOwn: boolean;
  showAvatar: boolean;
  onDelete: (id: string) => void;
}

function MessageBubble({ message, isOwn, showAvatar, onDelete }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const isAI = message.type === "ai_response";
  const isDeleted = message.isDeleted;

  const senderName = isAI
    ? "SmartDoc AI 🤖"
    : message.senderId
    ? (message.senderId as any).username
    : "Ẩn danh";

  const avatarChar = isAI
    ? "AI"
    : senderName?.charAt(0).toUpperCase();

  const timeString = new Date(message.createdAt).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex items-end gap-2.5 group",
        isOwn && !isAI ? "flex-row-reverse" : "flex-row"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className="shrink-0 mb-1">
        {showAvatar ? (
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm",
              isAI
                ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                : isOwn
                ? "bg-blue-500"
                : "bg-slate-400"
            )}
          >
            {isAI ? <Bot size={13} /> : avatarChar}
          </div>
        ) : (
          <div className="w-7 h-7" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "flex flex-col max-w-[70%]",
          isOwn && !isAI ? "items-end" : "items-start"
        )}
      >
        {/* Sender name */}
        {showAvatar && (
          <span className="text-[10px] font-semibold text-slate-400 mb-1 px-1">
            {isOwn && !isAI ? "Bạn" : senderName}
          </span>
        )}

        {/* Message content */}
        <div
          className={cn(
            "relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words",
            isAI
              ? "bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 text-slate-700 rounded-bl-sm"
              : isOwn
              ? "bg-blue-600 text-white rounded-br-sm"
              : "bg-slate-100 text-slate-700 rounded-bl-sm",
            isDeleted && "opacity-50 italic"
          )}
        >
          {/* AI badge */}
          {isAI && !isDeleted && (
            <div className="flex items-center gap-1 mb-1.5">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">
                SmartDoc AI
              </span>
            </div>
          )}

          {/* Content */}
          <p className="whitespace-pre-wrap">{message.content}</p>

          {/* AI Sources */}
          {isAI && message.sources && message.sources.length > 0 && !isDeleted && (
            <div className="mt-2 pt-2 border-t border-indigo-100/50">
              <p className="text-[10px] font-semibold text-indigo-400 mb-1">
                Nguồn tham khảo:
              </p>
              <div className="flex flex-wrap gap-1">
                {message.sources.map((s, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium"
                  >
                    📄 {s.fileName}
                    {s.pageNumber ? `, tr.${s.pageNumber}` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Time & Actions */}
        <div
          className={cn(
            "flex items-center gap-1.5 mt-1 px-1",
            isOwn && !isAI ? "flex-row-reverse" : "flex-row"
          )}
        >
          <span className="text-[10px] text-slate-400">{timeString}</span>

          {/* Delete button (chỉ hiện với tin nhắn của chính mình & chưa xóa) */}
          <AnimatePresence>
            {showActions && isOwn && !isAI && !isDeleted && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => onDelete(message._id)}
                className="text-slate-300 hover:text-red-400 transition-colors"
                title="Xóa tin nhắn"
              >
                <Trash2 size={10} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
