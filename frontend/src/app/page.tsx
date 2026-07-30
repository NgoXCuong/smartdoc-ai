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
import DocumentTable from "@/components/dashboard/DocumentTable";
import MoveDocumentModal from "@/components/dashboard/MoveDocumentModal";

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
      // Cache current workspace to localStorage for the global ClientLayout uploader
      localStorage.setItem("activeWorkspaceId", currentWorkspaceId || "");
    }
  }, [currentWorkspaceId, user, searchQuery]);

  useEffect(() => {
    const handleDocumentUploaded = () => {
      fetchDocuments(false, currentWorkspaceId, searchQuery); // background refresh
      fetchUsage(); // fetch updated storage stats
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
        fetchDocuments(false, currentWorkspaceId, searchQuery); // background refresh
        fetchUsage(); // refresh usage
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
          fetchDocuments(false, currentWorkspaceId, searchQuery); // Refresh to get tags & summary
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
    e.stopPropagation(); // Prevent card click
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
  const maxStorage = usageData?.quota?.maxStorageBytes || 1073741824; // 1GB default
  const storagePercent = Math.min((usedStorage / maxStorage) * 100, 100);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    return mb < 1000 ? `${mb.toFixed(2)} MB` : `${(mb / 1024).toFixed(2)} GB`;
  };

  if (!user) return null;

  return (
    <>
      <Header
        workspaces={workspaces}
        currentWorkspaceId={currentWorkspaceId}
        setCurrentWorkspaceId={setCurrentWorkspaceId}
        onSearchChange={setSearchQuery}
      />

      <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 relative">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50/50 to-transparent -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-[1200px] mx-auto"
        >
          <StatsOverview
            user={user}
            documentsLength={documents.length}
            completedDocs={completedDocs}
            processingDocs={processingDocs}
          />

          <DocumentTable
            documents={documents}
            loading={loading}
            handleDelete={handleDelete}
            onOpenMoveModal={(doc) => {
              setSelectedDoc(doc);
              setIsMoveModalOpen(true);
            }}
            onRefresh={() => fetchDocuments(true, currentWorkspaceId, searchQuery)}
          />

          {/* Bottom Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="col-span-2 bg-[#0A47B7] rounded-2xl p-8 relative overflow-hidden text-white flex flex-col items-start justify-center shadow-md">
              <h2 className="text-[22px] font-bold mb-2">Trò chuyện với văn bản</h2>
              <p className="text-blue-100/90 mb-6 text-[13px] max-w-sm leading-relaxed">
                Sử dụng AI để tóm tắt, tìm kiếm thông tin và phân tích tài liệu của bạn trong vài giây.
              </p>
              <button 
                onClick={() => router.push("/chat")}
                className="bg-white text-[#0A47B7] px-6 py-2.5 rounded-full font-bold text-sm shadow-sm hover:bg-slate-50 transition-colors z-10"
              >
                Bắt đầu ngay
              </button>
            </div>

            <div className="col-span-1 bg-[#F0F5FF] rounded-2xl p-7 flex flex-col justify-center">
              <h3 className="text-[15px] font-bold text-slate-800 mb-6">Dung lượng lưu trữ</h3>
              <div className="w-full h-1.5 bg-blue-200/50 rounded-full mb-3 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${storagePercent}%` }}></div>
              </div>
              <div className="flex justify-between items-center text-[11px] font-semibold mb-6">
                <span className="text-slate-600">{formatBytes(usedStorage)} đã dùng</span>
                <span className="text-slate-400">{formatBytes(maxStorage)} tổng cộng</span>
              </div>
              <button 
                onClick={() => router.push("/settings")}
                className="w-full bg-transparent border border-blue-200 text-blue-600 hover:bg-blue-100/50 py-2.5 rounded-full font-bold text-sm transition-colors"
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
