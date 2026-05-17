"use client";

import React, { useState, useEffect } from "react";
import { folderApi } from "@/services/api";
import { toast } from "react-hot-toast";
import {
  FolderPlus,
  Folder as FolderIcon,
  MoreVertical,
  Trash2,
  Pencil,
  ChevronRight,
  FileText,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function FoldersPage() {
  const router = useRouter();
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const res = await folderApi.getAll();
      setFolders(res.data.folders || []);
    } catch (error) {
      toast.error("Không thể tải danh sách thư mục");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      if (editingFolder) {
        await folderApi.update(editingFolder._id, {
          name: newFolderName,
          color: selectedColor
        });
        toast.success("Đã cập nhật thư mục");
      } else {
        await folderApi.create(newFolderName, selectedColor);
        toast.success("Đã tạo thư mục mới");
      }
      resetModal();
      fetchFolders();
    } catch (error) {
      toast.error(editingFolder ? "Lỗi khi cập nhật" : "Lỗi khi tạo thư mục");
    }
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setNewFolderName("");
    setSelectedColor("#2563eb");
    setEditingFolder(null);
  };

  const handleOpenEdit = (e: React.MouseEvent, folder: any) => {
    e.stopPropagation();
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setSelectedColor(folder.color || "#2563eb");
    setIsModalOpen(true);
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thư mục này? Các tài liệu bên trong sẽ được đưa ra ngoài.")) return;
    try {
      await folderApi.delete(id);
      toast.success("Đã xóa thư mục");
      fetchFolders();
    } catch (error) {
      toast.error("Lỗi khi xóa thư mục");
    }
  };

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Dự án & Thư mục</h1>
          <p className="text-slate-500 text-sm">Quản lý và gom nhóm tài liệu của bạn.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
        >
          <FolderPlus size={18} />
          Thư mục mới
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12 text-slate-400">Đang tải...</div>
      ) : folders.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderIcon className="text-slate-300" size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Chưa có thư mục nào</h3>
          <p className="text-slate-500 mb-6">Hãy tạo thư mục đầu tiên để quản lý tài liệu theo dự án.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-primary font-bold hover:underline"
          >
            Tạo ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {folders.map((folder) => (
            <motion.div
              key={folder._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => router.push(`/folders/${folder._id}`)}
              className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group cursor-pointer relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white transition-transform group-hover:scale-110"
                  style={{ backgroundColor: folder.color || '#2563eb' }}
                >
                  <FolderIcon size={24} fill="currentColor" fillOpacity={0.2} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleOpenEdit(e, folder)}
                    className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-all"
                    title="Chỉnh sửa"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder._id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors truncate">{folder.name}</h3>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <FileText size={12} />
                  Dự án riêng tư
                </span>
                <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal tạo thư mục */}
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

              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-900">
                  {editingFolder ? "Chỉnh sửa thư mục" : "Tạo thư mục mới"}
                </h2>
                <button onClick={resetModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateFolder}>
                <div className="mb-6">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Tên thư mục</label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="VD: Tài liệu học tập, Dự án X..."
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                </div>

                <div className="mb-8">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Màu sắc nhận diện</label>
                  <div className="flex flex-wrap gap-3">
                    {colors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-full transition-all flex items-center justify-center ${selectedColor === color ? 'ring-4 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                        style={{
                          backgroundColor: color,
                          boxShadow: selectedColor === color ? `0 0 0 2px white, 0 0 0 5px ${color}40` : 'none'
                        }}
                      >
                        {selectedColor === color && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={resetModal}
                    className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!newFolderName.trim()}
                    className="flex-2 px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:shadow-none"
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
  );
}
