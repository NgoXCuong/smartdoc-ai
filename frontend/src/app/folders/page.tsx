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
    <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 relative min-h-screen">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/50 to-transparent -z-10" />

      <div className="max-w-[1200px] mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Dự án & Thư mục</h1>
            <p className="text-slate-500 text-sm">Quản lý và gom nhóm tài liệu của bạn.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-600/20 hover:bg-blue-700 active:bg-blue-800 transition-all"
          >
            <FolderPlus size={18} />
            Thư mục mới
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : folders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FolderIcon className="text-blue-400" size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa có thư mục nào</h3>
            <p className="text-slate-500 mb-6 font-medium">Hãy tạo thư mục đầu tiên để quản lý tài liệu theo dự án.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-blue-600 font-bold hover:text-blue-700 transition-colors"
            >
              Tạo ngay
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Filter & Sort Bar */}
            <div className="flex justify-between items-center bg-white rounded-2xl p-2 shadow-sm border border-slate-100">
              <div className="flex gap-1 bg-slate-50 p-1 rounded-xl">
                <button className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm">Tất cả</button>
                <button className="px-5 py-2 text-slate-600 hover:bg-slate-200/50 rounded-lg text-sm font-semibold transition-colors">Cá nhân</button>
                <button className="px-5 py-2 text-slate-600 hover:bg-slate-200/50 rounded-lg text-sm font-semibold transition-colors">Đã chia sẻ</button>
              </div>
              <div className="flex items-center gap-2 px-4 text-sm font-medium text-slate-500 cursor-pointer hover:text-slate-800">
                <span>Sắp xếp theo:</span>
                <span className="font-bold text-blue-600">Mới nhất</span>
                <ChevronRight size={16} className="rotate-90" />
              </div>
            </div>

            {/* Quick Access Section (Mock) */}
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-blue-600">⚡</span> Truy cập nhanh
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {folders.slice(0, 2).map((folder) => (
                  <div key={`quick-${folder._id}`} onClick={() => router.push(`/folders/${folder._id}`)} className="bg-white rounded-[20px] p-6 border border-slate-200/80 shadow-sm cursor-pointer hover:shadow-md transition-all flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-4" style={{ backgroundColor: folder.color || '#2563eb' }}>
                      <FolderIcon size={32} fill="currentColor" fillOpacity={0.2} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-[15px]">{folder.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Vừa truy cập</p>
                  </div>
                ))}
                <div onClick={() => setIsModalOpen(true)} className="bg-slate-50/50 rounded-[20px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors h-[172px]">
                  <div className="w-10 h-10 rounded-full bg-slate-200/50 text-slate-500 flex items-center justify-center mb-3">
                    <span className="text-xl font-bold">+</span>
                  </div>
                  <span className="text-sm font-bold text-slate-500">Ghim thư mục</span>
                </div>
              </div>
            </div>

            {/* All Folders Section */}
            <div>
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-[17px] font-bold text-slate-700">Tất cả thư mục</h2>
                <span className="text-[11px] text-slate-400 font-semibold uppercase">{folders.length} thư mục</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {folders.map((folder) => (
                  <motion.div
                    key={folder._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => router.push(`/folders/${folder._id}`)}
                    className="bg-white rounded-[20px] p-6 border border-slate-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all duration-300 group cursor-pointer relative flex flex-col justify-between h-[180px]"
                  >
                    <div>
                      <div className="flex justify-between items-start w-full">
                        <div
                          className="w-11 h-11 rounded-[14px] flex items-center justify-center text-white transition-transform group-hover:scale-105 duration-300"
                          style={{ backgroundColor: folder.color || '#2563eb' }}
                        >
                          <FolderIcon size={22} fill="currentColor" fillOpacity={0.2} />
                        </div>

                        {/* Hover actions replacing the 3 dots */}
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleOpenEdit(e, folder)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all"
                            title="Chỉnh sửa"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFolder(folder._id);
                            }}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="opacity-100 group-hover:opacity-0 absolute top-6 right-6 transition-opacity text-slate-400">
                          <MoreVertical size={20} />
                        </div>
                      </div>

                      <div className="mt-5">
                        <h3 className="font-bold text-slate-800 text-[15px] group-hover:text-blue-600 transition-colors line-clamp-1">
                          {folder.name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex justify-between items-end mt-2">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-md tracking-wider">
                        DỰ ÁN CHUNG
                      </span>
                      <span className="text-[12px] font-medium text-slate-500">0 tài liệu</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
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

                <div className="flex justify-between items-center mb-6 mt-2">
                  <h2 className="text-2xl font-bold text-slate-800">
                    {editingFolder ? "Chỉnh sửa thư mục" : "Tạo thư mục mới"}
                  </h2>
                  <button onClick={resetModal} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateFolder}>
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tên thư mục</label>
                    <input
                      type="text"
                      autoFocus
                      placeholder="VD: Tài liệu học tập, Dự án X..."
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                    />
                  </div>

                  <div className="mb-8">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Màu sắc nhận diện</label>
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
