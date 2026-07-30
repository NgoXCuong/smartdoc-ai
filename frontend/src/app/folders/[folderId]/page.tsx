"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { folderApi, documentApi } from "@/services/api";
import { toast } from "react-hot-toast";
import {
  Folder as FolderIcon,
  FolderPlus,
  FileText,
  ChevronRight,
  Loader2,
  Search,
  Plus,
  Trash2,
  Pencil,
  Download,
  ArrowLeft,
  X,
  MoreVertical
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FolderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = params.folderId as string;

  const [folder, setFolder] = useState<any>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([]);
  const [subfolders, setSubfolders] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Subfolder modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#2563eb");
  const [editingFolder, setEditingFolder] = useState<any>(null);

  const colors = [
    "#2563eb", "#7c3aed", "#db2777", "#dc2626",
    "#ea580c", "#ca8a04", "#16a34a", "#0891b2",
    "#475569"
  ];

  useEffect(() => {
    fetchData();

    const handleDocumentUploaded = () => {
      fetchData();
    };
    window.addEventListener("document-uploaded", handleDocumentUploaded);
    return () => window.removeEventListener("document-uploaded", handleDocumentUploaded);
  }, [folderId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [folderRes, breadRes, subRes, docsRes] = await Promise.all([
        folderApi.getById(folderId),
        folderApi.getBreadcrumbs(folderId),
        folderApi.getAll(folderId),
        documentApi.getAll(1, 50, search, folderId)
      ]);
      setFolder(folderRes.data.folder);
      setBreadcrumbs(breadRes.data.breadcrumbs || []);
      setSubfolders(subRes.data.folders || []);
      setDocuments(docsRes.data.documents || []);
    } catch (error) {
      toast.error("Không thể tải thông tin thư mục");
      router.push("/folders");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateSubfolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      if (editingFolder) {
        await folderApi.update(editingFolder._id, {
          name: newFolderName,
          color: selectedColor,
        });
        toast.success("Đã cập nhật thư mục");
      } else {
        await folderApi.create(newFolderName, selectedColor, folderId);
        toast.success("Đã tạo thư mục con mới");
      }
      resetModal();
      fetchData();
    } catch (error) {
      toast.error(editingFolder ? "Lỗi khi cập nhật" : "Lỗi khi tạo thư mục con");
    }
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setNewFolderName("");
    setSelectedColor("#2563eb");
    setEditingFolder(null);
  };

  const handleOpenEditFolder = (e: React.MouseEvent, targetFolder: any) => {
    e.stopPropagation();
    setEditingFolder(targetFolder);
    setNewFolderName(targetFolder.name);
    setSelectedColor(targetFolder.color || "#2563eb");
    setIsModalOpen(true);
  };

  const handleDeleteFolder = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa thư mục này và các thư mục con bên trong?")) return;
    try {
      await folderApi.delete(id);
      toast.success("Đã xóa thư mục");
      fetchData();
    } catch (error) {
      toast.error("Lỗi khi xóa thư mục");
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
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb Navigation Bar */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6 font-medium bg-white px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-sm w-fit">
          <button
            onClick={() => router.push("/folders")}
            className="hover:text-blue-600 font-semibold transition-colors flex items-center gap-1"
          >
            <FolderIcon size={16} className="text-blue-600" />
            Tất cả thư mục
          </button>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb._id}>
              <ChevronRight size={14} className="text-slate-400 shrink-0" />
              {idx === breadcrumbs.length - 1 ? (
                <span className="font-bold text-slate-800 line-clamp-1">{crumb.name}</span>
              ) : (
                <button
                  onClick={() => router.push(`/folders/${crumb._id}`)}
                  className="hover:text-blue-600 transition-colors line-clamp-1"
                >
                  {crumb.name}
                </button>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (breadcrumbs.length > 1) {
                  router.push(`/folders/${breadcrumbs[breadcrumbs.length - 2]._id}`);
                } else {
                  router.push("/folders");
                }
              }}
              className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200 shadow-sm"
              title="Quay lại"
            >
              <ArrowLeft size={20} />
            </button>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: folder?.color || "#2563eb" }}
            >
              <FolderIcon size={24} fill="currentColor" fillOpacity={0.2} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">{folder?.name}</h1>
              <p className="text-slate-500 text-sm font-medium">
                {subfolders.length} thư mục con • {documents.length} tài liệu
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-2xl font-bold hover:bg-blue-100 transition-all shadow-sm text-sm"
            >
              <FolderPlus size={18} />
              Thư mục con mới
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("trigger-upload", { detail: { folderId } }))}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-sm text-sm"
            >
              <Plus size={18} />
              Tải tài liệu vào đây
            </button>
          </div>
        </div>

        {/* Subfolders Section */}
        {subfolders.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FolderIcon className="text-blue-600" size={20} />
              Thư mục con ({subfolders.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subfolders.map((sub) => (
                <motion.div
                  key={sub._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => router.push(`/folders/${sub._id}`)}
                  className="bg-white rounded-[20px] p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all group cursor-pointer relative flex flex-col justify-between h-[150px]"
                >
                  <div>
                    <div className="flex justify-between items-start w-full">
                      <div
                        className="w-10 h-10 rounded-[12px] flex items-center justify-center text-white transition-transform group-hover:scale-105"
                        style={{ backgroundColor: sub.color || "#2563eb" }}
                      >
                        <FolderIcon size={20} fill="currentColor" fillOpacity={0.2} />
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleOpenEditFolder(e, sub)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteFolder(e, sub._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h3 className="font-bold text-slate-800 text-[14px] group-hover:text-blue-600 transition-colors line-clamp-1">
                        {sub.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex justify-between items-end text-xs text-slate-500 font-medium">
                    <span>{sub.subFolderCount || 0} thư mục con</span>
                    <span>{sub.docCount || 0} tài liệu</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Documents Search & List */}
        <div className="mb-6 flex justify-between items-center gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-blue-600" size={20} />
            Tài liệu ({documents.length})
          </h2>
          <div className="w-72 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchData()}
            />
          </div>
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
                              {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(doc.createdAt).toLocaleDateString("vi-VN")}
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
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="text-slate-300" size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Chưa có tài liệu trực thuộc</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">Bạn có thể tạo thư mục con hoặc tải tài liệu mới lên đây.</p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("trigger-upload", { detail: { folderId } }))}
                className="text-blue-600 font-bold hover:underline text-sm"
              >
                + Tải tài liệu vào thư mục này ngay
              </button>
            </div>
          )}
        </div>

        {/* Modal Tạo/Sửa Thư Mục Con */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: selectedColor }}></div>

                <div className="flex justify-between items-center mb-6 mt-2">
                  <h2 className="text-2xl font-bold text-slate-800">
                    {editingFolder ? "Chỉnh sửa thư mục" : `Tạo thư mục con trong "${folder?.name}"`}
                  </h2>
                  <button onClick={resetModal} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateOrUpdateSubfolder}>
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tên thư mục con</label>
                    <input
                      type="text"
                      autoFocus
                      placeholder="VD: Module NestJS, API Documentation..."
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                    />
                  </div>

                  <div className="mb-8">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Màu sắc nhận diện</label>
                    <div className="flex flex-wrap gap-3">
                      {colors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`w-10 h-10 rounded-full transition-all flex items-center justify-center ${selectedColor === color ? "ring-4 ring-offset-2 scale-110" : "hover:scale-105"}`}
                          style={{
                            backgroundColor: color,
                            boxShadow: selectedColor === color ? `0 0 0 2px white, 0 0 0 5px ${color}40` : "none",
                          }}
                        >
                          {selectedColor === color && <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm"></div>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={resetModal}
                      className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={!newFolderName.trim()}
                      className="flex-[2] px-6 py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none"
                    >
                      {editingFolder ? "Lưu thay đổi" : "Tạo ngay"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
