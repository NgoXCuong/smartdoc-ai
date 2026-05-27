"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { documentApi, folderApi, workspaceApi } from "@/services/api";
import { useSocket } from "@/hooks/useSocket";

// Dashboard Components
import Header from "@/components/dashboard/Header";
import StatsOverview from "@/components/dashboard/StatsOverview";
import DocumentTable from "@/components/dashboard/DocumentTable";
import MoveDocumentModal from "@/components/dashboard/MoveDocumentModal";

export default function Dashboard() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
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
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchDocuments(true, currentWorkspaceId);
    }
  }, [currentWorkspaceId, user]);

  useEffect(() => {
    const handleTriggerUpload = () => {
      document.getElementById('global-upload-input')?.click();
    };
    window.addEventListener('trigger-upload', handleTriggerUpload);
    return () => window.removeEventListener('trigger-upload', handleTriggerUpload);
  }, []);

  const socket = useSocket(user?._id || user?.id || null);

  useEffect(() => {
    if (socket) {
      socket.on("document_status", (data) => {
        if (data.status === "completed") {
          toast.success(`Tài liệu "${data.fileName}" đã xử lý xong!`);
        } else if (data.status === "failed") {
          toast.error(`Lỗi xử lý tài liệu "${data.fileName}": ${data.errorMessage}`);
        }
        fetchDocuments(false, currentWorkspaceId); // background refresh
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
          fetchDocuments(false, currentWorkspaceId); // Refresh to get tags & summary
        }
      });

      return () => {
        socket.off("document_status");
        socket.off("document_progress");
      };
    }
  }, [socket, currentWorkspaceId]);

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

  const fetchDocuments = async (showLoading = true, workspaceId: string | null = null) => {
    if (showLoading) setLoading(true);
    try {
      const res = await documentApi.getAll(1, 50, "", "", workspaceId || "");
      setDocuments(res.data.documents || []);
    } catch (error) {
      console.error("Fetch docs error:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File quá lớn. Vui lòng chọn file dưới 20MB.");
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Đang tải tài liệu lên...");

    try {
      await documentApi.upload(file, currentWorkspaceId);
      toast.success("Tải lên thành công! Hệ thống đang xử lý...", { id: toastId });
      fetchDocuments(true, currentWorkspaceId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi tải lên", { id: toastId });
    } finally {
      setUploading(false);
      if (e.target) e.target.value = ''; // Reset input
    }
  };

  const handleDelete = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation(); // Prevent card click
    if (!confirm("Bạn có chắc chắn muốn xóa tài liệu này không? Hành động này không thể hoàn tác.")) return;

    const toastId = toast.loading("Đang xóa...");
    try {
      await documentApi.delete(docId);
      toast.success("Đã xóa tài liệu", { id: toastId });
      fetchDocuments(true, currentWorkspaceId);
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
      fetchDocuments(true, currentWorkspaceId);
    } catch (error) {
      toast.error("Lỗi khi chuyển tài liệu");
    }
  };

  const completedDocs = documents.filter(d => d.status === "completed").length;
  const processingDocs = documents.filter(d => d.status === "processing" || d.status === "pending").length;

  if (!user) return null;

  return (
    <>
      <Header
        workspaces={workspaces}
        currentWorkspaceId={currentWorkspaceId}
        setCurrentWorkspaceId={setCurrentWorkspaceId}
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
            uploading={uploading}
            handleFileUpload={handleFileUpload}
            handleDelete={handleDelete}
            onOpenMoveModal={(doc) => {
              setSelectedDoc(doc);
              setIsMoveModalOpen(true);
            }}
          />

          {/* Bottom Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="col-span-2 bg-[#0A47B7] rounded-2xl p-8 relative overflow-hidden text-white flex flex-col items-start justify-center shadow-md">
              <h2 className="text-[22px] font-bold mb-2">Trò chuyện với văn bản</h2>
              <p className="text-blue-100/90 mb-6 text-[13px] max-w-sm leading-relaxed">
                Sử dụng AI để tóm tắt, tìm kiếm thông tin và phân tích tài liệu của bạn trong vài giây.
              </p>
              <button className="bg-white text-[#0A47B7] px-6 py-2.5 rounded-full font-bold text-sm shadow-sm hover:bg-slate-50 transition-colors z-10">
                Bắt đầu ngay
              </button>
            </div>

            <div className="col-span-1 bg-[#F0F5FF] rounded-2xl p-7 flex flex-col justify-center">
              <h3 className="text-[15px] font-bold text-slate-800 mb-6">Dung lượng lưu trữ</h3>
              <div className="w-full h-1.5 bg-blue-200/50 rounded-full mb-3 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '25%' }}></div>
              </div>
              <div className="flex justify-between items-center text-[11px] font-semibold mb-6">
                <span className="text-slate-600">250MB đã dùng</span>
                <span className="text-slate-400">1GB tổng cộng</span>
              </div>
              <button className="w-full bg-transparent border border-blue-200 text-blue-600 hover:bg-blue-100/50 py-2.5 rounded-full font-bold text-sm transition-colors">
                Nâng cấp dung lượng
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <input
        type="file"
        id="global-upload-input"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.md,image/*"
        onChange={handleFileUpload}
        disabled={uploading}
      />

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
