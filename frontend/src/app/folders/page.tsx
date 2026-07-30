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
  X,
  Search,
  Pin,
  Share2,
  FolderOpen,
  ArrowUpDown,
  Sparkles,
  Clock,
  Check
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
  
  // Filtering & Search & Pin state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "personal" | "shared">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [pinnedFolderIds, setPinnedFolderIds] = useState<string[]>([]);
  const [activeMenuFolderId, setActiveMenuFolderId] = useState<string | null>(null);

  const colors = [
    "#2563eb", "#7c3aed", "#db2777", "#dc2626",
    "#ea580c", "#ca8a04", "#16a34a", "#0891b2",
    "#475569"
  ];

  useEffect(() => {
    fetchFolders();
    // Load pinned folders from localStorage
    const savedPinned = localStorage.getItem("pinnedFolderIds");
    if (savedPinned) {
      try {
        setPinnedFolderIds(JSON.parse(savedPinned));
      } catch (e) {}
    }
  }, []);

  const togglePinFolder = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    setActiveMenuFolderId(null);
    let updated: string[];
    if (pinnedFolderIds.includes(folderId)) {
      updated = pinnedFolderIds.filter(id => id !== folderId);
      toast.success("Đã bỏ ghim thư mục");
    } else {
      updated = [...pinnedFolderIds, folderId];
      toast.success("Đã ghim thư mục vào Truy cập nhanh");
    }
    setPinnedFolderIds(updated);
    localStorage.setItem("pinnedFolderIds", JSON.stringify(updated));
  };

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

  // Tính toán danh sách thư mục sau khi Lọc, Tìm kiếm & Sắp xếp
  const filteredFolders = folders
    .filter((folder) => {
      // Shared / Personal Filter
      const isShared = folder.sharedWith && folder.sharedWith.length > 0;
      if (activeFilter === "personal" && isShared) return false;
      if (activeFilter === "shared" && !isShared) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (folder.name || "").toLowerCase().includes(query);
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
        return (a.name || "").localeCompare(b.name || "", "vi");
      }
      return 0;
    });

  const pinnedFoldersList = folders.filter(f => pinnedFolderIds.includes(f._id));

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
    setActiveMenuFolderId(null);
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setSelectedColor(folder.color || "#2563eb");
    setIsModalOpen(true);
  };

  const handleDeleteFolder = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenuFolderId(null);
    if (!confirm("Bạn có chắc chắn muốn xóa thư mục này? Các tài liệu bên trong sẽ được đưa ra ngoài.")) return;
    try {
      await folderApi.delete(id);
      toast.success("Đã xóa thư mục");
      fetchFolders();
    } catch (error) {
      toast.error("Lỗi khi xóa thư mục");
    }
  };

  const handleMoveFolder = (e: React.MouseEvent, folder: any) => {
    e.stopPropagation();
    setActiveMenuFolderId(null);
    toast.success(`Đã chọn di chuyển thư mục "${folder.name}"`);
  };

  const handleShareFolder = (e: React.MouseEvent, folder: any) => {
    e.stopPropagation();
    setActiveMenuFolderId(null);
    toast.success(`Tính năng chia sẻ cho thư mục "${folder.name}" đang được bật!`);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 relative min-h-screen" onClick={() => setActiveMenuFolderId(null)}>
      <div className="max-w-[1200px] mx-auto">
        
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <FolderIcon size={20} />
              </div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
                Dự án & Thư mục
              </h1>
            </div>
            <p className="text-slate-500 text-xs font-semibold ml-11">
              Tổ chức không gian làm việc theo cấu trúc: Dự án → Thư mục → Tài liệu AI.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-bold text-xs shadow-sm shadow-blue-600/20 transition-all"
          >
            <FolderPlus size={16} />
            + Dự án / Thư mục mới
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6">
          {/* Search Input Box */}
          <div className="md:col-span-6 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm dự án hoặc thư mục theo tên..."
              className="w-full bg-white border border-slate-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Type Filter Tabs */}
          <div className="md:col-span-6 flex justify-between items-center bg-white rounded-xl p-1 shadow-2xs border border-slate-200/80">
            <div className="flex gap-1 w-full">
              <button
                onClick={() => setActiveFilter("all")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all text-center ${
                  activeFilter === "all"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tất cả ({folders.length})
              </button>
              <button
                onClick={() => setActiveFilter("personal")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all text-center ${
                  activeFilter === "personal"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cá nhân ({folders.filter(f => !f.sharedWith || f.sharedWith.length === 0).length})
              </button>
              <button
                onClick={() => setActiveFilter("shared")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all text-center ${
                  activeFilter === "shared"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Đã chia sẻ ({folders.filter(f => f.sharedWith && f.sharedWith.length > 0).length})
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : folders.length === 0 ? (
          /* Empty State khi chưa có thư mục nào */
          <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center shadow-2xs my-4">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 border border-blue-100">
              <FolderIcon size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Chưa có dự án hoặc thư mục nào</h3>
            <p className="text-slate-500 text-xs mb-6 font-medium max-w-sm mx-auto">
              Tạo thư mục để tổ chức tài liệu và xây dựng không gian làm việc riêng.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all inline-flex items-center gap-2"
            >
              <FolderPlus size={16} />
              + Tạo mới
            </button>
          </div>
        ) : (
          <div className="space-y-8">

            {/* Quick Access / Pinned Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  ⚡ Truy cập nhanh ({pinnedFoldersList.length > 0 ? pinnedFoldersList.length : Math.min(2, filteredFolders.length)})
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(pinnedFoldersList.length > 0 ? pinnedFoldersList : filteredFolders.slice(0, 2)).map((folder) => {
                  const isShared = folder.sharedWith && folder.sharedWith.length > 0;
                  const memberCount = isShared ? (folder.sharedWith?.length || 1) + 1 : 1;

                  return (
                    <div
                      key={`quick-${folder._id}`}
                      onClick={() => router.push(`/folders/${folder._id}`)}
                      className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs cursor-pointer hover:shadow-md transition-all flex flex-col justify-between h-[135px] relative group"
                    >
                      <div className="flex justify-between items-start">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-2xs"
                          style={{ backgroundColor: folder.color || '#2563eb' }}
                        >
                          <FolderIcon size={20} fill="currentColor" fillOpacity={0.2} />
                        </div>
                        <button
                          onClick={(e) => togglePinFolder(e, folder._id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            pinnedFolderIds.includes(folder._id)
                              ? "text-amber-500 bg-amber-50"
                              : "text-slate-300 hover:text-amber-500 hover:bg-slate-100"
                          }`}
                          title={pinnedFolderIds.includes(folder._id) ? "Bỏ ghim" : "Ghim vào Truy cập nhanh"}
                        >
                          <Pin size={15} className={pinnedFolderIds.includes(folder._id) ? "fill-amber-500" : ""} />
                        </button>
                      </div>

                      <div>
                        <h3 className="font-extrabold text-slate-800 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                          {folder.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-semibold mt-1 flex items-center gap-1.5">
                          <span>{folder.docCount || 0} tài liệu</span>
                          <span>•</span>
                          <span>{memberCount} thành viên</span>
                          <span>•</span>
                          <span>Vừa xong</span>
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Add Quick Pin Card */}
                <div
                  onClick={() => setIsModalOpen(true)}
                  className="bg-slate-50/60 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100/60 transition-colors h-[135px]"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-200/70 text-slate-500 flex items-center justify-center mb-1.5 font-bold text-sm">
                    +
                  </div>
                  <span className="text-xs font-bold text-slate-600">Tạo dự án / thư mục mới</span>
                </div>
              </div>
            </div>

            {/* All Folders Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-extrabold text-slate-800 tracking-tight">
                  Tất cả dự án & thư mục
                </h2>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-semibold">
                    Hiển thị <span className="text-slate-700 font-bold">{filteredFolders.length}</span> mục
                  </span>

                  {/* Dropdown Sắp xếp */}
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsSortDropdownOpen(!isSortDropdownOpen); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
                    >
                      <ArrowUpDown size={14} className="text-slate-400" />
                      <span>Sắp xếp:</span>
                      <span className="text-blue-600 font-bold">
                        {sortBy === "newest" ? "Mới nhất" : sortBy === "oldest" ? "Cũ nhất" : "Tên A-Z"}
                      </span>
                    </button>

                    {isSortDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200/80 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                        <button
                          onClick={() => { setSortBy("newest"); setIsSortDropdownOpen(false); }}
                          className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between ${sortBy === "newest" ? "text-blue-600 font-bold bg-blue-50/50" : "text-slate-700"}`}
                        >
                          Mới nhất {sortBy === "newest" && <Check size={14} />}
                        </button>
                        <button
                          onClick={() => { setSortBy("oldest"); setIsSortDropdownOpen(false); }}
                          className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between ${sortBy === "oldest" ? "text-blue-600 font-bold bg-blue-50/50" : "text-slate-700"}`}
                        >
                          Cũ nhất {sortBy === "oldest" && <Check size={14} />}
                        </button>
                        <button
                          onClick={() => { setSortBy("name"); setIsSortDropdownOpen(false); }}
                          className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between ${sortBy === "name" ? "text-blue-600 font-bold bg-blue-50/50" : "text-slate-700"}`}
                        >
                          Tên A-Z {sortBy === "name" && <Check size={14} />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {filteredFolders.length === 0 ? (
                /* Empty state khi tìm kiếm không ra */
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-2xs">
                  <p className="text-slate-500 font-semibold text-xs mb-3">
                    Không tìm thấy mục nào phù hợp với từ khóa "{searchQuery}".
                  </p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Xóa bộ lọc tìm kiếm
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {filteredFolders.map((folder) => {
                    const isPinned = pinnedFolderIds.includes(folder._id);
                    const isShared = folder.sharedWith && folder.sharedWith.length > 0;
                    const isMenuOpen = activeMenuFolderId === folder._id;
                    const memberCount = isShared ? (folder.sharedWith?.length || 1) + 1 : 1;

                    return (
                      <motion.div
                        key={folder._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => router.push(`/folders/${folder._id}`)}
                        className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all group cursor-pointer relative flex flex-col justify-between h-[165px]"
                      >
                        <div>
                          <div className="flex justify-between items-start w-full">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-transform group-hover:scale-105 duration-200 shadow-2xs"
                                style={{ backgroundColor: folder.color || '#2563eb' }}
                              >
                                <FolderIcon size={20} fill="currentColor" fillOpacity={0.2} />
                              </div>
                              {isShared ? (
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-md tracking-wider border border-indigo-100">
                                  DỰ ÁN NHÓM
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded-md tracking-wider border border-slate-200/60">
                                  THƯ MỤC CÁ NHÂN
                                </span>
                              )}
                            </div>

                            {/* 3 Dots Menu Button with 6 actions & Tooltip */}
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setActiveMenuFolderId(isMenuOpen ? null : folder._id)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Tùy chọn thao tác"
                              >
                                <MoreVertical size={18} />
                              </button>

                              {/* Action Dropdown Menu */}
                              {isMenuOpen && (
                                <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-30 overflow-hidden py-1 text-xs font-semibold">
                                  <button
                                    onClick={() => { setActiveMenuFolderId(null); router.push(`/folders/${folder._id}`); }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center gap-2 text-slate-700"
                                  >
                                    <FolderOpen size={14} className="text-blue-600" />
                                    Mở
                                  </button>

                                  <button
                                    onClick={(e) => handleOpenEdit(e, folder)}
                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center gap-2 text-slate-700"
                                  >
                                    <Pencil size={14} className="text-indigo-600" />
                                    Đổi tên & màu
                                  </button>

                                  <button
                                    onClick={(e) => togglePinFolder(e, folder._id)}
                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center gap-2 text-slate-700"
                                  >
                                    <Pin size={14} className={isPinned ? "text-amber-500 fill-amber-500" : "text-slate-400"} />
                                    {isPinned ? "Bỏ ghim" : "Ghim"}
                                  </button>

                                  <button
                                    onClick={(e) => handleShareFolder(e, folder)}
                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center gap-2 text-slate-700"
                                  >
                                    <Share2 size={14} className="text-blue-600" />
                                    Chia sẻ
                                  </button>

                                  <button
                                    onClick={(e) => handleMoveFolder(e, folder)}
                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center gap-2 text-slate-700"
                                  >
                                    <FolderIcon size={14} className="text-slate-500" />
                                    Di chuyển
                                  </button>

                                  <hr className="my-1 border-slate-100" />

                                  <button
                                    onClick={(e) => handleDeleteFolder(e, folder._id)}
                                    className="w-full text-left px-3.5 py-2 hover:bg-rose-50 transition-colors flex items-center gap-2 text-rose-600 font-bold"
                                  >
                                    <Trash2 size={14} />
                                    Xóa
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-3">
                            <h3 className="font-extrabold text-slate-800 text-sm group-hover:text-blue-600 transition-colors line-clamp-1" title={folder.name}>
                              {folder.name}
                            </h3>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[11px] font-medium text-slate-400 border-t border-slate-100 pt-2.5 mt-2">
                          <span className="font-bold text-slate-600">
                            {folder.docCount || 0} tài liệu · {memberCount} thành viên
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {folder.createdAt ? new Date(folder.createdAt).toLocaleDateString('vi-VN') : 'Vừa xong'}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Tạo/Sửa Thư mục */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden border border-slate-200"
              >
                <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: selectedColor }}></div>

                <div className="flex justify-between items-center mb-5 mt-1">
                  <h2 className="text-lg font-extrabold text-slate-800">
                    {editingFolder ? "Chỉnh sửa thư mục" : "Tạo thư mục mới"}
                  </h2>
                  <button onClick={resetModal} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-full transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateFolder}>
                  <div className="mb-5">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tên thư mục / Dự án</label>
                    <input
                      type="text"
                      autoFocus
                      placeholder="VD: Dự án Nghiên cứu AI, Học tập..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold text-xs text-slate-800 placeholder:text-slate-400"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Màu sắc nhận diện</label>
                    <div className="flex flex-wrap gap-2.5">
                      {colors.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`w-8 h-8 rounded-xl transition-all flex items-center justify-center ${selectedColor === color ? 'ring-2 ring-offset-2 ring-blue-600 scale-105' : 'hover:scale-105'}`}
                          style={{ backgroundColor: color }}
                        >
                          {selectedColor === color && <div className="w-2 h-2 bg-white rounded-full shadow-xs" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={resetModal}
                      className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={!newFolderName.trim()}
                      className="flex-[2] px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none"
                    >
                      {editingFolder ? "Lưu thay đổi" : "Tạo mới"}
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

