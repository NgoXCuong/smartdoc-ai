"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { documentApi, folderApi, workspaceApi, usageApi } from "@/services/api";
import { useSocket } from "@/hooks/useSocket";

// Dashboard Components
import Header from "@/components/dashboard/Header";
import StatsOverview from "@/components/dashboard/StatsOverview";
import MoveDocumentModal from "@/components/dashboard/MoveDocumentModal";
import { FileText, ArrowRight, Clock, Cpu, Download, Share2, History, Trash2, HardDrive } from "lucide-react";

export default function Dashboard() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [usageData, setUsageData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/auth");
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchWorkspaces();
      fetchFolders();
      fetchUsage();
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchDocuments(true, currentWorkspaceId, searchQuery);
      localStorage.setItem("activeWorkspaceId", currentWorkspaceId || "");
    }
  }, [currentWorkspaceId, user, searchQuery]);

  useEffect(() => {
    const handleDocumentUploaded = () => {
      fetchDocuments(false, currentWorkspaceId, searchQuery);
      fetchUsage();
    };
    window.addEventListener("document-uploaded", handleDocumentUploaded);
    return () => window.removeEventListener("document-uploaded", handleDocumentUploaded);
  }, [currentWorkspaceId, searchQuery]);

  const socket = useSocket(user?._id || user?.id || null);

  useEffect(() => {
    if (socket) {
      socket.on("document_status", (data) => {
        if (data.status === "completed") {
          toast.success(`Tài liệu "${data.fileName}" đã xử lý xong!`);
        } else if (data.status === "failed") {
          toast.error(`Lỗi xử lý tài liệu "${data.fileName}": ${data.errorMessage}`);
        }
        fetchDocuments(false, currentWorkspaceId, searchQuery);
        fetchUsage();
      });

      socket.on("document_progress", (data) => {
        setDocuments((prevDocs) =>
          prevDocs.map((doc) =>
            doc._id === data.docId
              ? { ...doc, progress: data.progress, status: data.status }
              : doc
          )
        );
        if (data.status === "completed") {
          fetchDocuments(false, currentWorkspaceId, searchQuery);
          fetchUsage();
        }
      });

      return () => {
        socket.off("document_status");
        socket.off("document_progress");
      };
    }
  }, [socket, currentWorkspaceId, searchQuery]);

  const fetchWorkspaces = async () => {
    try {
      const res = await workspaceApi.getAll();
      setWorkspaces(res.data.workspaces || []);
    } catch (error) {
      console.error("Fetch workspaces error:", error);
    }
  };

  const fetchFolders = async () => {
    try {
      const res = await folderApi.getAll();
      setFolders(res.data.folders || []);
    } catch (error) {
      console.error("Fetch folders error:", error);
    }
  };

  const fetchUsage = async () => {
    try {
      const res = await usageApi.getMe();
      setUsageData(res.data);
    } catch (error) {
      console.error("Fetch usage stats error:", error);
    }
  };

  const fetchDocuments = async (showLoading = true, workspaceId: string | null = null, search = "") => {
    if (showLoading) setLoading(true);
    try {
      const res = await documentApi.getAll(1, 50, search, "", workspaceId || "");
      setDocuments(res.data.documents || []);
    } catch (error) {
      console.error("Fetch docs error:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa tài liệu này không? Hành động này không thể hoàn tác.")) return;

    const toastId = toast.loading("Đang xóa...");
    try {
      await documentApi.delete(docId);
      toast.success("Đã xóa tài liệu", { id: toastId });
      fetchDocuments(true, currentWorkspaceId, searchQuery);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi xóa", { id: toastId });
    }
  };

  const handleMove = async (folderId: string | null) => {
    if (!selectedDoc) return;
    try {
      await folderApi.moveDocument(selectedDoc._id, folderId);
      toast.success(folderId ? "Đã chuyển tài liệu vào thư mục" : "Đã đưa tài liệu ra ngoài");
      setIsMoveModalOpen(false);
      fetchDocuments(true, currentWorkspaceId, searchQuery);
    } catch (error) {
      toast.error("Lỗi khi chuyển tài liệu");
    }
  };

  const completedDocs = documents.filter(d => d.status === "completed").length;
  const processingDocs = documents.filter(d => d.status === "processing" || d.status === "pending").length;

  const usedStorage = usageData?.totalStorageBytes || 0;
  const maxStorage = usageData?.quota?.maxStorageBytes || 1073741824;
  const storagePercent = Math.min((usedStorage / maxStorage) * 100, 100);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    return mb < 1000 ? `${mb.toFixed(2)} MB` : `${(mb / 1024).toFixed(2)} GB`;
  };

  // Top 5 recent documents for Dashboard
  const recentDocuments = documents.slice(0, 5);

  if (!user) return null;

  return (
    <>
      <Header
        workspaces={workspaces}
        currentWorkspaceId={currentWorkspaceId}
        setCurrentWorkspaceId={setCurrentWorkspaceId}
        onSearchChange={setSearchQuery}
      />

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 relative">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-[1200px] mx-auto"
        >
          {/* AI Knowledge Workspace Dashboard Main Overview */}
          <StatsOverview
            user={user}
            documentsLength={documents.length}
            completedDocs={completedDocs}
            processingDocs={processingDocs}
          />

          {/* 7. Recent Documents Section (Clean 5-6 Items view) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs mb-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <FileText size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-800">📄 Tài liệu gần đây</h3>
                <span className="text-xs text-slate-400 font-semibold">({recentDocuments.length} / {documents.length})</span>
              </div>
              
              <button
                onClick={() => router.push('/documents')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1.5 bg-blue-50/80 hover:bg-blue-100/80 px-3.5 py-1.5 rounded-xl border border-blue-200/60"
              >
                Xem tất cả tài liệu <ArrowRight size={14} />
              </button>
            </div>

            {recentDocuments.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentDocuments.map((doc) => {
                  const fileNameLower = (doc.fileName || "").toLowerCase();
                  const isPdf = fileNameLower.endsWith(".pdf");
                  const isDocx = fileNameLower.endsWith(".docx") || fileNameLower.endsWith(".doc");
                  const isTxt = fileNameLower.endsWith(".txt") || fileNameLower.endsWith(".md");

                  return (
                    <div
                      key={doc._id}
                      onClick={() => router.push('/documents')}
                      className="py-3.5 px-3 flex items-center justify-between hover:bg-blue-50/40 rounded-xl transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="shrink-0">
                          {isPdf ? (
                            <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center font-bold text-[10px]">
                              PDF
                            </div>
                          ) : isDocx ? (
                            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                              DOC
                            </div>
                          ) : isTxt ? (
                            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[10px]">
                              TXT
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-[10px]">
                              FILE
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {doc.fileName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {doc.fileSize ? (doc.fileSize / 1024 / 1024).toFixed(2) : "0.00"} MB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          doc.status === "completed" 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                            : "bg-amber-50 text-amber-600 border-amber-200"
                        }`}>
                          {doc.status === "completed" ? "✅ Indexed" : "⏳ Processing"}
                        </span>

                        <span className="text-[11px] font-medium text-slate-400 hidden sm:inline-block">
                          {doc.createdAt && !isNaN(new Date(doc.createdAt).getTime())
                            ? new Date(doc.createdAt).toLocaleDateString('vi-VN')
                            : "Vừa xong"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs font-medium">
                Chưa có tài liệu nào gần đây. Hãy tải lên tài liệu mới!
              </div>
            )}
          </div>

          {/* Bottom Banner Storage Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <div className="col-span-2 bg-[#0A47B7] rounded-2xl p-7 relative overflow-hidden text-white flex flex-col items-start justify-center shadow-md">
              <h2 className="text-xl font-bold mb-2">Trò chuyện với văn bản bằng AI RAG</h2>
              <p className="text-blue-100/90 mb-5 text-[12px] max-w-md leading-relaxed">
                Hệ thống hỗ trợ tóm tắt, truy vấn ngữ nghĩa chuyên sâu và trích xuất trích dẫn chính xác từ tài liệu của bạn.
              </p>
              <button 
                onClick={() => router.push("/chat")}
                className="bg-white text-[#0A47B7] px-5 py-2 rounded-full font-bold text-xs shadow-sm hover:bg-slate-50 transition-colors z-10"
              >
                Bắt đầu trò chuyện →
              </button>
            </div>

            <div className="col-span-1 bg-[#F0F5FF] rounded-2xl p-6 flex flex-col justify-center border border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <HardDrive size={15} className="text-blue-600" /> Storage Usage
                </h3>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                  {storagePercent.toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-2 bg-blue-200/50 rounded-full mb-3 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${storagePercent}%` }}></div>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold mb-4">
                <span className="text-slate-600">{formatBytes(usedStorage)} đã dùng</span>
                <span className="text-slate-400">{formatBytes(maxStorage)} tổng cộng</span>
              </div>
              <button 
                onClick={() => router.push("/settings")}
                className="w-full bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 py-2 rounded-xl font-bold text-xs transition-colors"
              >
                Nâng cấp dung lượng
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <MoveDocumentModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        selectedDoc={selectedDoc}
        folders={folders}
        handleMove={handleMove}
      />
    </>
  );
}
