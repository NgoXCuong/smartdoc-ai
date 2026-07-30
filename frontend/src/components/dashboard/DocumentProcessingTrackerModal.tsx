"use client";

import React, { useEffect, useState } from "react";
import { X, CheckCircle2, Loader2, Cpu, FileText, Scissors, Layers, Sparkles, AlertCircle } from "lucide-react";
import { documentApi } from "@/services/api";
import { useSocket } from "@/hooks/useSocket";
import { cn } from "@/lib/utils";

interface DocumentProcessingTrackerModalProps {
  doc: any;
  onClose: () => void;
}

export default function DocumentProcessingTrackerModal({ doc, onClose }: DocumentProcessingTrackerModalProps) {
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setUserId(u._id || u.id || null);
      } catch (e) {}
    }
  }, []);

  const socket = useSocket(userId);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await documentApi.getJob(doc._id);
        if (res.data?.job) {
          setJob(res.data.job);
        }
      } catch (err) {
        console.error("Lỗi lấy thông tin Pipeline Job:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [doc._id]);

  useEffect(() => {
    if (!socket) return;

    const handleJobUpdate = (data: any) => {
      if (data.docId === doc._id && data.job) {
        setJob(data.job);
      }
    };

    socket.on("document_job_update", handleJobUpdate);
    return () => {
      socket.off("document_job_update", handleJobUpdate);
    };
  }, [socket, doc._id]);

  const currentStep = job?.currentStep || (doc.status === "completed" ? "completed" : "extract");
  const stepsData = job?.steps || {};

  const getStepStatus = (stepName: string) => {
    if (doc.status === "completed") return "completed";
    if (doc.status === "failed" && currentStep === stepName) return "failed";

    const order = ["extract", "chunk", "embedding", "summary", "completed"];
    const currentIndex = order.indexOf(currentStep);
    const stepIndex = order.indexOf(stepName);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "in_progress";
    return "pending";
  };

  const stepsList = [
    {
      key: "extract",
      title: "Trích xuất văn bản (PDF / OCR)",
      icon: FileText,
      description: () => {
        const pageCount = stepsData.extract?.pageCount || doc.pageCount || 1;
        const ocr = stepsData.extract?.ocrEnabled || doc.ocrEnabled;
        const duration = stepsData.extract?.durationMs ? `(${ (stepsData.extract.durationMs / 1000).toFixed(1) }s)` : "";
        return `Đã đọc ${pageCount} trang ${ocr ? "bằng OCR quét ảnh" : "văn bản chuẩn"} ${duration}`;
      },
    },
    {
      key: "chunk",
      title: "Cắt nhỏ văn bản (Text Chunking)",
      icon: Scissors,
      description: () => {
        const chunks = stepsData.chunk?.totalChunks || doc.totalChunks || 0;
        return chunks > 0 ? `Đã tách thành ${chunks} đoạn văn bản (chunks)` : "Đang xử lý phân đoạn ngữ cảnh...";
      },
    },
    {
      key: "embedding",
      title: "Tạo Vector Embedding",
      icon: Layers,
      description: () => "Mô hình: gemini-embedding-001 (768 chiều vector)",
    },
    {
      key: "summary",
      title: "Sinh tóm tắt & Gợi ý AI",
      icon: Sparkles,
      description: () => "Tự động phân tích tổng quan nội dung và câu hỏi liên quan",
    },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <Cpu size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-800 truncate" title={doc.fileName}>
                Pipeline Xử lý: {doc.fileName}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Theo dõi tiến trình AI trích xuất & indexed vector
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="py-12 flex justify-center items-center">
              <Loader2 size={32} className="animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stepper List */}
              <div className="relative pl-6 space-y-8 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {stepsList.map((step) => {
                  const status = getStepStatus(step.key);
                  const Icon = step.icon;

                  return (
                    <div key={step.key} className="relative flex items-start gap-4">
                      {/* Step Indicator Dot/Icon */}
                      <div
                        className={cn(
                          "absolute -left-6 top-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm z-10",
                          status === "completed"
                            ? "bg-emerald-500 text-white shadow-emerald-200"
                            : status === "in_progress"
                            ? "bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-indigo-200"
                            : status === "failed"
                            ? "bg-rose-500 text-white shadow-rose-200"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        )}
                      >
                        {status === "completed" ? (
                          <CheckCircle2 size={16} />
                        ) : status === "in_progress" ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : status === "failed" ? (
                          <AlertCircle size={15} />
                        ) : (
                          <Icon size={14} />
                        )}
                      </div>

                      <div className="ml-3 min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4
                            className={cn(
                              "text-xs font-bold leading-tight",
                              status === "completed"
                                ? "text-slate-800"
                                : status === "in_progress"
                                ? "text-indigo-600"
                                : status === "failed"
                                ? "text-rose-600"
                                : "text-slate-400"
                            )}
                          >
                            {step.title}
                          </h4>
                          <span
                            className={cn(
                              "text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider",
                              status === "completed"
                                ? "bg-emerald-50 text-emerald-700"
                                : status === "in_progress"
                                ? "bg-indigo-50 text-indigo-700 animate-pulse"
                                : status === "failed"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-slate-100 text-slate-400"
                            )}
                          >
                            {status === "completed"
                              ? "Hoàn tất"
                              : status === "in_progress"
                              ? "Đang xử lý"
                              : status === "failed"
                              ? "Thất bại"
                              : "Chờ xử lý"}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          {step.description()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress Summary Footer */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Trạng thái tổng thể
                  </span>
                  <span className="text-xs font-black text-slate-800">
                    {doc.status === "completed"
                      ? "100% - Đã sẵn sàng Chat RAG"
                      : doc.status === "failed"
                      ? "Gặp lỗi xử lý"
                      : `${doc.progress || 0}% - Đang chạy Pipeline`}
                  </span>
                </div>

                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all active:scale-95"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
