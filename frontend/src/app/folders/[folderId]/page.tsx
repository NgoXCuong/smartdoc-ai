"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { folderApi, documentApi } from "@/services/api";
import { toast } from "react-hot-toast";
import {
  Folder as FolderIcon,
  FileText,
  ChevronLeft,
  Loader2,
  Search,
  Plus,
  Trash2,
  Pencil,
  Download,
  ArrowLeft
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function FolderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = params.folderId as string;

  const [folder, setFolder] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, [folderId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [folderRes, docsRes] = await Promise.all([
        folderApi.getById(folderId),
        documentApi.getAll(1, 50, search, folderId)
      ]);
      setFolder(folderRes.data.folder);
      setDocuments(docsRes.data.documents || []);
    } catch (error) {
      toast.error("Không thể tải thông tin thư mục");
      router.push("/folders");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoc = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc muốn xóa tài liệu này?")) return;
    try {
      await documentApi.delete(docId);
      toast.success("Đã xóa tài liệu");
      fetchData();
    } catch (error) {
      toast.error("Lỗi khi xóa tài liệu");
    }
  };

  if (loading && !folder) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/folders")}
            className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200 shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
            style={{ backgroundColor: folder?.color || '#2563eb' }}
          >
            <FolderIcon size={24} fill="currentColor" fillOpacity={0.2} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">{folder?.name}</h1>
            <p className="text-slate-500 text-sm font-medium">Thư mục dự án • {documents.length} tài liệu</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex justify-between items-center mb-8 gap-4">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm trong thư mục..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchData()}
            />
          </div>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <Plus size={18} />
            Thêm tài liệu
          </button>
        </div>

        {/* Document List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {documents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="px-8 py-5 border-b border-slate-100">Tên tài liệu</th>
                    <th className="px-8 py-5 border-b border-slate-100 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr
                      key={doc._id}
                      onClick={() => router.push(`/chat?docId=${doc._id}`)}
                      className="group hover:bg-slate-50/50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <FileText size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm line-clamp-1">{doc.fileName}</p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                            <Download size={16} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteDoc(e, doc._id)}
                            className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="text-slate-200" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Thư mục trống</h3>
              <p className="text-slate-500 mb-8 max-w-xs mx-auto">Bạn chưa có tài liệu nào trong thư mục này.</p>
              <button
                onClick={() => router.push("/")}
                className="text-primary font-bold hover:underline"
              >
                Quay lại trang chủ để tải lên
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
