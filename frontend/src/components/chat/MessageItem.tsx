"use client";

import React from "react";
import { motion } from "framer-motion";
import { Bot, User, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MessageItemProps {
  msg: any;
  idx: number;
  onSourceClick?: (docId: string, pageNumber: string | number, fileName?: string) => void;
}

export default function MessageItem({ msg, idx, onSourceClick }: MessageItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-4 w-full",
        msg.role === "user" ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div className={cn(
        "w-8 h-8 shrink-0 rounded-full flex items-center justify-center mt-1 shadow-sm",
        msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-white border border-border text-primary"
      )}>
        {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div className={cn(
        "max-w-[80%] rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed",
        msg.role === "user"
          ? "bg-primary text-primary-foreground rounded-tr-none"
          : "bg-white border border-border text-foreground rounded-tl-none"
      )}>
        {/* Render Text using Markdown */}
        <div className={cn(
          "prose prose-sm max-w-none break-words",
          msg.role === "user" ? "prose-invert prose-p:leading-relaxed" : "prose-slate"
        )}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {msg.content}
          </ReactMarkdown>
        </div>

        {/* Render Sources if available */}
        {msg.metadata?.sources && msg.metadata.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <p className="text-xs font-bold text-muted-foreground mb-2">Nguồn trích dẫn:</p>
            <div className="flex flex-wrap gap-2">
              {msg.metadata.sources.map((src: any, i: number) => (
                <button 
                  key={i} 
                  onClick={() => onSourceClick && onSourceClick(src.docId, src.pageNumber, src.fileName)}
                  className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded text-[10px] font-semibold text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer border border-transparent hover:border-primary/20"
                  title="Nhấp để xem nguồn tài liệu"
                >
                  <FileText size={10} />
                  [{src.index}] {src.fileName} (Trang {src.pageNumber || 'N/A'})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
