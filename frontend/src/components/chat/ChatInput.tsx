"use client";

import React from "react";
import { Send, Lightbulb } from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  handleSend: (e: React.FormEvent) => void;
  selectedDocIds: string[];
  loading: boolean;
  documents?: any[];
}

export default function ChatInput({ input, setInput, handleSend, selectedDocIds, loading, documents = [] }: ChatInputProps) {
  // Tìm tài liệu đang chọn để lấy suggestedQuestions (nếu chọn đúng 1 tài liệu)
  const selectedDoc = selectedDocIds.length === 1 ? documents.find(d => d._id === selectedDocIds[0]) : null;
  
  const globalPrompts = [
    "Tóm tắt nội dung chính",
    "Tìm các điểm quan trọng nhất",
  ];

  const suggestedQuestions = selectedDoc?.suggestedQuestions || globalPrompts;

  const handlePromptClick = (promptText: string) => {
    setInput(promptText);
  };

  return (
    <div className="p-4 bg-white border-t border-border shrink-0">
      {/* Khu vực hiển thị Prompt Templates */}
      {selectedDocIds.length > 0 && suggestedQuestions.length > 0 && (
        <div className="max-w-3xl mx-auto mb-3 flex flex-wrap gap-2">
          {suggestedQuestions.slice(0, 3).map((q: string, i: number) => (
            <button
              key={i}
              onClick={() => handlePromptClick(q)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-colors"
            >
              <Lightbulb size={12} className={selectedDoc ? "text-amber-500" : "text-primary"} />
              <span className="truncate max-w-[250px]">{q}</span>
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSend} className="max-w-3xl mx-auto relative flex items-end gap-2 bg-slate-50 border border-border p-2 rounded-2xl focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all shadow-sm">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          placeholder={selectedDocIds.length > 0 ? "Đặt câu hỏi về tài liệu..." : "Vui lòng chọn tài liệu trước..."}
          disabled={selectedDocIds.length === 0 || loading}
          className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 min-h-[44px] p-2 text-sm disabled:opacity-50"
          rows={1}
        />
        <button
          type="submit"
          disabled={!input.trim() || selectedDocIds.length === 0 || loading}
          className="shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          <Send size={18} className="ml-0.5" />
        </button>
      </form>
      <div className="text-center mt-2">
        <span className="text-[10px] text-muted-foreground font-medium">SmartDoc AI có thể mắc lỗi. Vui lòng kiểm tra lại các trích dẫn.</span>
      </div>
    </div>
  );
}
