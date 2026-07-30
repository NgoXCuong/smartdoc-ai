"use client";

import React, { useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  handleSend: (e: React.FormEvent) => void;
  selectedDocIds: string[];
  loading: boolean;
  documents?: any[];
}

export default function ChatInput({ input, setInput, handleSend, selectedDocIds, loading }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "24px";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 120) + "px";
    }
  }, [input]);

  return (
    <div className="w-full pb-6 pt-2 px-4 md:px-8 bg-transparent shrink-0">
      <form 
        onSubmit={handleSend} 
        className="max-w-3xl mx-auto relative flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] focus-within:shadow-[0_10px_40px_-10px_rgba(37,99,235,0.15)] focus-within:border-blue-400 transition-all pl-6 pr-2"
      >
        {/* Ô nhập liệu */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          placeholder={selectedDocIds.length > 0 ? "Nhập câu hỏi hoặc yêu cầu tóm tắt tài liệu..." : "Vui lòng chọn ít nhất 1 tài liệu ở thanh bên trái để bắt đầu..."}
          disabled={selectedDocIds.length === 0 || loading}
          className="flex-1 bg-transparent border-none outline-none resize-none min-h-[24px] max-h-[120px] py-1 text-[14px] text-slate-800 placeholder:text-slate-400 disabled:opacity-50 overflow-y-auto"
          rows={1}
        />

        {/* Nút gửi tin nhắn */}
        <button
          type="submit"
          disabled={!input.trim() || selectedDocIds.length === 0 || loading}
          className={cn(
            "shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md",
            input.trim() && selectedDocIds.length > 0 && !loading
              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30"
              : "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed"
          )}
          title="Gửi câu hỏi"
        >
          <Send size={18} className={input.trim() && selectedDocIds.length > 0 && !loading ? "ml-0.5" : ""} />
        </button>
      </form>

      {/* Thông tin phụ bên dưới */}
      <div className="max-w-3xl mx-auto text-center mt-3">
        <p className="text-[11px] font-medium text-slate-400">
          SmartDoc AI trợ lý phân tích văn bản. Thông tin đưa ra dựa trên tài liệu được chọn.
        </p>
      </div>
    </div>
  );
}
