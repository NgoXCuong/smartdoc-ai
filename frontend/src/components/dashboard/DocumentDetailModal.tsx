"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  FileText, 
  Sparkles, 
  Download, 
  Share2, 
  CheckCircle2, 
  BrainCircuit, 
  Clock, 
  HardDrive, 
  Tag, 
  Layers, 
  ExternalLink,
  MessageSquare,
  FileCheck
} from "lucide-react";
import { useRouter } from "next/navigation";

interface DocumentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: any;
  onOpenShare?: () => void;
  onOpenVersion?: () => void;
}

export default function DocumentDetailModal({
  isOpen,
  onClose,
  document: doc,
  onOpenShare,
  onOpenVersion
}: DocumentDetailModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"analysis" | "preview">("analysis");

  if (!isOpen || !doc) return null;

  const fileNameLower = (doc.fileName || "").toLowerCase();
  const isPdf = fileNameLower.endsWith(".pdf");
  const isDocx = fileNameLower.endsWith(".docx") || fileNameLower.endsWith(".doc");
  const isTxt = fileNameLower.endsWith(".txt") || fileNameLower.endsWith(".md");

  const chunksCount = (doc.fileSize ? Math.ceil(doc.fileSize / 1500) : 45);

  const handleStartChat = () => {
    onClose();
    router.push(`/chat?docId=${doc._id}`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                {isPdf ? (
                  <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center font-black text-xs shadow-2xs">
                    PDF
                  </div>
                ) : isDocx ? (
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-black text-xs shadow-2xs">
                    DOC
                  </div>
                ) : isTxt ? (
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-black text-xs shadow-2xs">
                    TXT
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center font-black text-xs">
                    FILE
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-slate-800 text-base line-clamp-1" title={doc.fileName}>
                    {doc.fileName}
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-50 text-indigo-600 border border-indigo-200">
                    v{doc.version || 1}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mt-0.5">
                  <span className="flex items-center gap-1"><HardDrive size={12} /> {(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('vi-VN') : 'Vừa xong'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Action Bar */}
          <div className="p-4 bg-indigo-900 text-white flex items-center justify-between gap-3 px-6 shadow-inner">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <CheckCircle2 size={13} /> AI Ready ({chunksCount} chunks)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleStartChat}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm active:scale-95 transition-all"
              >
                <Sparkles size={14} /> Chat với tài liệu này
              </button>

              {doc.fileUrl && (
                <button
                  onClick={() => window.open(doc.fileUrl, '_blank')}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
                  title="Tải về file gốc"
                >
                  <Download size={15} />
                </button>
              )}

              {onOpenShare && (
                <button
                  onClick={() => { onClose(); onOpenShare(); }}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
                  title="Chia sẻ tài liệu"
                >
                  <Share2 size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* AI Analysis Summary */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80">
              <div className="flex items-center gap-2 mb-3">
                <BrainCircuit size={18} className="text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Tóm tắt nội dung AI</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {doc.summary || "Tài liệu đã được lập chỉ mục Semantic Vector. Bạn có thể đặt bất kỳ câu hỏi nào về nội dung chi tiết của file này để AI trích xuất thông tin."}
              </p>
            </div>

            {/* AI Tags & Keywords */}
            {doc.tags && doc.tags.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Tag size={13} /> Chủ đề & Từ khóa nhận diện
                </h4>
                <div className="flex flex-wrap gap-2">
                  {doc.tags.map((tag: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-100">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Knowledge Chunks & Index Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 block mb-1">Knowledge Chunks</span>
                <span className="text-base font-extrabold text-blue-900">{chunksCount} Chunks</span>
              </div>
              <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 block mb-1">Vector Dimensions</span>
                <span className="text-base font-extrabold text-indigo-900">1,536 Dim</span>
              </div>
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 block mb-1">Status</span>
                <span className="text-base font-extrabold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-600" /> AI Ready
                </span>
              </div>
            </div>

            {/* Suggested Prompt Trigger */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Muốn đặt câu hỏi về tài liệu này?</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Bắt đầu phiên chat RAG riêng biệt với {doc.fileName}</p>
                </div>
              </div>
              <button
                onClick={handleStartChat}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
              >
                Hỏi ngay →
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
