"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, FileText, Cpu, Clock, Zap, Activity, ShieldCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MessageItemProps {
  msg: any;
  idx: number;
  onSourceClick?: (docId: string, pageNumber: string | number, fileName?: string) => void;
}

export default function MessageItem({ msg, idx, onSourceClick }: MessageItemProps) {
  const [showMetrics, setShowMetrics] = useState(false);

  // Parse Metrics info
  const latency = msg.latency ? (msg.latency > 100 ? `${(msg.latency / 1000).toFixed(2)}s` : `${msg.latency}ms`) : "N/A";
  const promptTokens = msg.promptTokens || 0;
  const completionTokens = msg.completionTokens || 0;
  const totalTokens = msg.totalTokens || (promptTokens + completionTokens);
  const modelName = msg.model || "gemini-flash-latest";

  const sources = msg.metadata?.sources || msg.sources || [];

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
        "max-w-[85%] sm:max-w-[80%] rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed relative",
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
        {sources && sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
              <FileText size={12} className="text-indigo-600" />
              Nguồn trích dẫn ({sources.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {sources.map((src: any, i: number) => {
                const rawScore = src.similarityScore;
                let matchScore = null;
                if (rawScore !== undefined && rawScore !== null && rawScore > 0) {
                  matchScore = rawScore > 1 ? Math.min(100, Math.round(rawScore)) : Math.round(rawScore * 100);
                }

                return (
                  <button 
                    key={i} 
                    onClick={() => onSourceClick && onSourceClick(src.docId, src.pageNumber, src.fileName)}
                    className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-indigo-50/80 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-slate-700 hover:text-indigo-700 transition-all cursor-pointer border border-slate-200/80 hover:border-indigo-200 shadow-2xs group"
                    title="Nhấp để xem đoạn nguồn tài liệu"
                  >
                    <FileText size={11} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    <span>
                      [{src.index || i + 1}] {src.fileName || "Tài liệu"} (Trang {src.pageNumber || "N/A"})
                    </span>

                    {/* Match Score Badge */}
                    {matchScore !== null && (
                      <span
                        className={cn(
                          "ml-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider",
                          matchScore >= 80
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : matchScore >= 60
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        )}
                      >
                        {matchScore}% Match
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Metrics Button & Panel (Only for assistant responses) */}
        {msg.role === "assistant" && (
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <button
              onClick={() => setShowMetrics(!showMetrics)}
              className="inline-flex items-center gap-1.5 font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/60 px-2.5 py-1 rounded-lg transition-all border border-slate-100 hover:border-indigo-100"
            >
              <Activity size={12} className="text-indigo-600" />
              Thông tin AI (Metrics)
            </button>

            {totalTokens > 0 && (
              <span className="font-mono text-[10px] text-slate-400">
                ⚡ {latency} • {totalTokens} tokens
              </span>
            )}
          </div>
        )}

        {/* Expandable AI Metrics Box */}
        <AnimatePresence>
          {showMetrics && msg.role === "assistant" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-2"
            >
              <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl text-xs space-y-2 font-mono shadow-md border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                    <Cpu size={13} /> Model AI:
                  </span>
                  <span className="text-slate-300 font-semibold">{modelName}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Clock size={13} /> Latency (Độ trễ):
                  </span>
                  <span className="text-slate-300">{latency}</span>
                </div>

                <div className="space-y-1 pt-0.5">
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Prompt Tokens:</span>
                    <span className="text-slate-200 font-bold">{promptTokens}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Completion Tokens:</span>
                    <span className="text-slate-200 font-bold">{completionTokens}</span>
                  </div>
                  <div className="flex justify-between text-indigo-300 text-xs font-bold pt-1 border-t border-slate-800">
                    <span>Tổng Token tiêu thụ:</span>
                    <span className="text-emerald-400">{totalTokens} tokens</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}
