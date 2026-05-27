"use client";

import React, { useRef, useEffect } from "react";
import { Send, Paperclip, Mic, Moon, ShieldCheck, Zap, Info } from "lucide-react";
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
        className="max-w-3xl mx-auto relative flex items-end gap-3 bg-white border border-slate-200 p-3 rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] focus-within:shadow-[0_10px_40px_-10px_rgba(37,99,235,0.15)] focus-within:border-blue-300 transition-all"
      >
        {/* Nút đính kèm */}
        <button 
          type="button" 
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
          disabled={loading}
        >
          <Paperclip size={20} />
        </button>

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
          placeholder={selectedDocIds.length > 0 ? "Type your message or ask a question about your documents..." : "Please select a document first..."}
          disabled={selectedDocIds.length === 0 || loading}
          className="flex-1 bg-transparent border-none outline-none resize-none min-h-[24px] max-h-[120px] py-2 text-[15px] text-slate-800 placeholder:text-slate-400 disabled:opacity-50 overflow-y-auto"
          rows={1}
        />

        {/* Nhóm nút tiện ích bên phải */}
        <div className="shrink-0 flex items-center gap-1">
          <button 
            type="button" 
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            disabled={loading}
          >
            <Mic size={20} />
          </button>
          
          <div className="relative flex items-center bg-slate-100 rounded-full p-0.5 mx-1">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Moon size={16} className="rotate-180" /> {/* Giả lập icon nửa trắng nửa đen */}
            </div>
          </div>

          <button
            type="submit"
            disabled={!input.trim() || selectedDocIds.length === 0 || loading}
            className={cn(
              "shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ml-1",
              input.trim() && selectedDocIds.length > 0 && !loading
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30"
                : "bg-slate-100 text-slate-400 shadow-none"
            )}
          >
            <Send size={20} className={input.trim() && selectedDocIds.length > 0 && !loading ? "ml-1" : ""} />
          </button>
        </div>
      </form>

      {/* Footer Info */}
      <div className="max-w-3xl mx-auto flex items-center justify-center gap-6 mt-4 text-[10px] font-bold text-slate-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={12} />
          <span>Enterprise Encryption</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap size={12} />
          <span>GPT-4o Enhanced</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Info size={12} />
          <span>Review Model Limits</span>
        </div>
      </div>
    </div>
  );
}
