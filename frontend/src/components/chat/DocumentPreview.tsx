"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileText, ExternalLink, X, FileJson, Info } from "lucide-react";
import DataExtractionModal from "./DataExtractionModal";

interface DocumentPreviewProps {
  previewDoc: any;
  onClose: () => void;
}

export default function DocumentPreview({ previewDoc, onClose }: DocumentPreviewProps) {
  const [showExtraction, setShowExtraction] = useState(false);

  if (!previewDoc) return null;

  const isOfficeDoc = previewDoc.fileName.match(/\.(docx|doc|xlsx|xls|pptx|ppt)$/i);
  const previewUrl = isOfficeDoc
    ? `https://docs.google.com/gview?url=${encodeURIComponent(previewDoc.fileUrl)}&embedded=true`
    : `${previewDoc.fileUrl}#page=${previewDoc.startPage || 1}&toolbar=0`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full h-full max-w-6xl rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0 bg-slate-50">
          <div className="flex items-center gap-3">
            <FileText className="text-primary" size={20} />
            <h3 className="font-bold text-foreground truncate max-w-md">{previewDoc.fileName}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExtraction(true)}
              className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              <FileJson size={14} /> Trích xuất dữ liệu
            </button>
            <a
              href={previewDoc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-border hover:bg-muted transition-colors"
            >
              <ExternalLink size={14} /> Mở tab mới
            </a>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 bg-slate-100 flex items-center justify-center relative">
            <iframe
              src={previewUrl}
              className="w-full h-full border-none"
              title={previewDoc.fileName}
            />
          </div>

          {/* Panel Tóm tắt */}
          {previewDoc.summary && (
            <div className="w-80 bg-white border-l border-border p-5 flex flex-col gap-4 shrink-0 overflow-y-auto">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Info size={18} />
                <h3>Tóm tắt nội dung</h3>
              </div>
              <div className="text-sm text-foreground/80 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {previewDoc.summary}
              </div>
              {previewDoc.suggestedQuestions && previewDoc.suggestedQuestions.length > 0 && (
                <div className="mt-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Câu hỏi gợi ý</h4>
                  <div className="flex flex-col gap-2">
                    {previewDoc.suggestedQuestions.map((q: string, idx: number) => (
                      <div key={idx} className="text-xs p-2.5 rounded-lg bg-primary/5 text-primary border border-primary/10 cursor-pointer hover:bg-primary/10 transition-colors">
                        {q}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {showExtraction && (
        <DataExtractionModal
          docId={previewDoc._id}
          docName={previewDoc.fileName}
          onClose={() => setShowExtraction(false)}
        />
      )}
    </div>
  );
}
