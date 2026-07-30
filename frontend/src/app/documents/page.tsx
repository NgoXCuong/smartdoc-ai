"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { documentApi, folderApi, workspaceApi, usageApi } from "@/services/api";
import { useSocket } from "@/hooks/useSocket";

import Header from "@/components/dashboard/Header";
import DocumentTable from "@/components/dashboard/DocumentTable";
import MoveDocumentModal from "@/components/dashboard/MoveDocumentModal";
import { FileText, Upload, Plus, Folder, Search, Filter, ArrowUpDown, CheckCircle2, Clock, Cpu, ShieldAlert, AlertCircle } from "lucide-react";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  // Filtering & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [localSearch, setLocalSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
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
      fetchDocuments(true, currentWorkspaceId, searchQuery);
      localStorage.setItem("activeWorkspaceId", currentWorkspaceId || "");
    }
  }, [currentWorkspaceId, user, searchQuery]);

  useEffect(() => {
    const handleDocumentUploaded = () => {
      fetchDocuments(false, currentWorkspaceId, searchQuery);
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

  const fetchDocuments = async (showLoading = true, workspaceId: string | null = null, search = "") => {
    if (showLoading) setLoading(true);
    try {
      const res = await documentApi.getAll(1, 100, search, "", workspaceId || "");
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

  // Filter & Sort Logic
  const completedDocsCount = documents.filter(d => d.status === "completed").length;
  const processingDocsCount = documents.filter(d => d.status === "processing" || d.status === "pending").length;
  const failedDocsCount = documents.filter(d => d.status === "failed").length;

  const filteredDocs = documents
    .filter((doc) => {
      // Status filter
      if (statusFilter === "completed" && doc.status !== "completed") return false;
      if (statusFilter === "processing" && (doc.status !== "processing" && doc.status !== "pending")) return false;
      if (statusFilter === "failed" && doc.status !== "failed") return false;

      // Format filter
      const name = (doc.fileName || "").toLowerCase();
      if (formatFilter === "pdf" && !name.endsWith(".pdf")) return false;
      if (formatFilter === "docx" && !name.endsWith(".docx") && !name.endsWith(".doc")) return false;
      if (formatFilter === "txt" && !name.endsWith(".txt") && !name.endsWith(".md")) return false;

      // Search text filter
      if (localSearch.trim()) {
        const query = localSearch.toLowerCase();
        return name.includes(query) || (doc.summary || "").toLowerCase().includes(query);
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortBy === "name") {
        return (a.fileName || "").localeCompare(b.fileName || "");
      }
      if (sortBy === "size") {
        return (b.fileSize || 0) - (a.fileSize || 0);
      }
      return 0;
    });

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
        <div className="max-w-[1200px] mx-auto">

          {/* 1. Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <FileText size={20} />
                </div>
                <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
                  Quản lý Tài liệu
                </h1>
              </div>
              <p className="text-slate-500 text-xs font-semibold ml-11">
                {documents.length} tài liệu · <span className="text-emerald-600 font-bold">{completedDocsCount} đã lập chỉ mục</span> · <span className="text-amber-600 font-bold">{processingDocsCount} đang xử lý</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('trigger-upload'))}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm shadow-blue-600/20 transition-all"
              >
                <Upload size={16} />
                Tải tài liệu lên
              </button>
            </div>
          </div>

          {/* 2. Toolbar: Search Bar + Format Filter + Sort */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
            {/* Search Box */}
            <div className="md:col-span-6 relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Tìm kiếm tài liệu theo tên, tóm tắt..."
                className="w-full bg-white border border-slate-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-2xs"
              />
              {localSearch && (
                <button
                  onClick={() => setLocalSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Format Filter Dropdown */}
            <div className="md:col-span-3 relative">
              <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold shadow-2xs">
                <Filter size={15} className="text-slate-400 shrink-0" />
                <select
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value)}
                  className="w-full bg-transparent text-slate-700 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="all">Tất cả định dạng</option>
                  <option value="pdf">Chỉ PDF (.pdf)</option>
                  <option value="docx">Word (.docx)</option>
                  <option value="txt">Văn bản (.txt, .md)</option>
                </select>
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="md:col-span-3 relative">
              <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold shadow-2xs">
                <ArrowUpDown size={15} className="text-slate-400 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-transparent text-slate-700 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="newest">Mới nhất trước</option>
                  <option value="oldest">Cũ nhất trước</option>
                  <option value="name">Tên file (A-Z)</option>
                  <option value="size">Kích thước lớn nhất</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Status Filter Tabs Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white rounded-2xl p-2 mb-6 shadow-2xs border border-slate-200/80 gap-3">
            <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap ${statusFilter === "all"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Tất cả ({documents.length})
              </button>
              <button
                onClick={() => setStatusFilter("completed")}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-1.5 ${statusFilter === "completed"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <CheckCircle2 size={14} /> AI Ready ({completedDocsCount})
              </button>
              <button
                onClick={() => setStatusFilter("processing")}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-1.5 ${statusFilter === "processing"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <Cpu size={14} /> Đang xử lý ({processingDocsCount})
              </button>
              {failedDocsCount > 0 && (
                <button
                  onClick={() => setStatusFilter("failed")}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-1.5 ${statusFilter === "failed"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  <AlertCircle size={14} /> Lỗi xử lý ({failedDocsCount})
                </button>
              )}
            </div>

            <div className="text-xs text-slate-400 font-semibold px-3">
              Hiển thị <span className="text-slate-700 font-bold">{filteredDocs.length}</span> tài liệu
            </div>
          </div>

          {/* 4. Main Document Table */}
          <DocumentTable
            documents={filteredDocs}
            loading={loading}
            handleDelete={handleDelete}
            onOpenMoveModal={(doc) => {
              setSelectedDoc(doc);
              setIsMoveModalOpen(true);
            }}
            onRefresh={() => fetchDocuments(true, currentWorkspaceId, searchQuery)}
          />
        </div>
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

