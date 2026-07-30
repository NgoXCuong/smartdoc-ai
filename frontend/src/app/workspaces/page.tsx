"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Users,
  MessageSquare,
  Plus,
  Loader2,
  Crown,
  ChevronRight,
  Search,
  Settings,
  Link as LinkIcon,
  ShieldCheck,
  UserCheck,
  FolderGit2,
  FileText,
  Clock,
  Sparkles
} from "lucide-react";
import { workspaceApi } from "@/services/api";
import { toast } from "react-hot-toast";
import WorkspaceModal from "@/components/chat/WorkspaceModal";

export default function WorkspacesPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/auth");
      return;
    }
    setCurrentUser(JSON.parse(stored));
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    setIsLoading(true);
    try {
      const res = await workspaceApi.getAll();
      setWorkspaces(res.data.workspaces || []);
    } catch (err) {
      toast.error("Không thể tải danh sách nhóm làm việc");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("Tên nhóm là bắt buộc");
      return;
    }
    setIsCreating(true);
    try {
      await workspaceApi.create(newName.trim(), newDesc.trim());
      toast.success("Đã tạo nhóm làm việc mới!");
      setShowCreateModal(false);
      setNewName("");
      setNewDesc("");
      fetchWorkspaces();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi tạo nhóm");
    } finally {
      setIsCreating(false);
    }
  };

  const filtered = workspaces.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  const currentUserId = currentUser?._id || currentUser?.id;

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    let code = joinCode.trim();
    if (code.includes("/join-workspace/")) {
      const parts = code.split("/join-workspace/");
      code = parts[parts.length - 1].replace(/\//g, "");
    }

    router.push(`/join-workspace/${code}`);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 min-h-screen">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-8 py-5 flex items-center justify-between shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Users size={18} />
            </div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Nhóm làm việc
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-semibold ml-10">
            Cộng tác, chia sẻ tài liệu và trao đổi AI theo từng dự án & nhóm.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 px-4 py-2 rounded-xl font-bold text-xs transition-all border border-slate-200"
          >
            <LinkIcon size={14} className="text-indigo-600" />
            Tham gia bằng mã
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm shadow-indigo-600/20 transition-all"
          >
            <Plus size={15} />
            + Tạo nhóm mới
          </button>
        </div>
      </div>

      <div className="px-8 py-6 max-w-5xl mx-auto">
        {/* Search */}
        <div className="relative mb-6">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm nhóm làm việc theo tên..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-2xs"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="text-indigo-500 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filtered.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center shadow-2xs my-6">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 border border-indigo-100 shadow-2xs">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-extrabold text-slate-800 mb-1">
              {search ? "Không tìm thấy nhóm phù hợp" : "Chưa tham gia nhóm làm việc nào"}
            </h3>
            <p className="text-slate-500 text-xs mb-6 font-medium max-w-sm mx-auto">
              {search
                ? `Không có kết quả nào khớp với từ khóa "${search}".`
                : "Tạo nhóm để cộng tác và trao đổi tài liệu với đồng nghiệp."}
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm shadow-indigo-600/20 transition-all inline-flex items-center gap-2"
              >
                <Plus size={16} />
                + Tạo nhóm mới
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all inline-flex items-center gap-2"
              >
                <LinkIcon size={15} className="text-indigo-600" />
                Tham gia bằng mã
              </button>
            </div>
          </div>
        )}

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((ws, i) => {
            const isOwner = ws.ownerId === currentUserId || ws.ownerId?._id === currentUserId;
            const memberCount = ws.members?.length || 1;

            return (
              <motion.div
                key={ws._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer relative flex flex-col justify-between"
                onClick={() => router.push(`/workspaces/${ws._id}/chat`)}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-2xs overflow-hidden">
                        {ws.avatar ? (
                          <img src={ws.avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          ws.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                          {ws.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                          {memberCount} thành viên
                        </p>
                      </div>
                    </div>

                    {/* Role Badge & Settings */}
                    <div className="flex items-center gap-2">
                      {isOwner ? (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 text-[10px] font-black rounded-lg flex items-center gap-1">
                          <Crown size={11} className="text-amber-500 fill-amber-400" />
                          Chủ nhóm
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200/60 text-[10px] font-bold rounded-lg flex items-center gap-1">
                          <UserCheck size={11} className="text-slate-500" />
                          Thành viên
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWorkspace(ws);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Cài đặt nhóm & Mã mời"
                      >
                        <Settings size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {ws.description ? (
                    <p className="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed font-medium">
                      {ws.description}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic mb-3">
                      Chưa có mô tả nhóm...
                    </p>
                  )}

                  {/* Recent Activity Status */}
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 mb-4 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5 text-indigo-600 font-bold">
                      <MessageSquare size={13} /> 3 tin nhắn mới
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock size={11} /> Hoạt động 10 phút trước
                    </span>
                  </div>
                </div>

                {/* Card Footer: Avatars + Highlighted Chat Button */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex -space-x-1.5 items-center">
                    {ws.members?.slice(0, 5).map((m: any, j: number) => (
                      <div
                        key={j}
                        className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-500 border-2 border-white flex items-center justify-center text-[9px] text-white font-bold shadow-2xs"
                        title={m.user?.username || "Thành viên"}
                      >
                        {(m.user?.username || "?").charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {memberCount > 5 && (
                      <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[9px] text-slate-600 font-bold">
                        +{memberCount - 5}
                      </div>
                    )}
                  </div>

                  {/* Highlighted Chat Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/workspaces/${ws._id}/chat`);
                    }}
                    className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 border border-indigo-100"
                  >
                    <MessageSquare size={13} />
                    Mở chat nhóm
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Create Workspace Modal ─────────────────────────────────────────── */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-extrabold text-slate-800 mb-1">
              Tạo nhóm làm việc mới
            </h2>
            <p className="text-xs text-slate-500 font-medium mb-5">
              Nhóm làm việc giúp bạn cộng tác và chia sẻ tài liệu với đồng nghiệp.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Tên nhóm <span className="text-rose-500">*</span>
                </label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="VD: Dự án AI Research, Phòng IT..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Mô tả nhóm
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Mô tả ngắn gọn về mục đích làm việc của nhóm..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-600 font-bold hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating || !newName.trim()}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  "Tạo nhóm ngay"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Manage / Invite Modal ────────────────────────────────────────── */}
      {selectedWorkspace && (
        <WorkspaceModal
          workspace={selectedWorkspace}
          onClose={() => setSelectedWorkspace(null)}
          onSuccess={() => {
            setSelectedWorkspace(null);
            fetchWorkspaces();
          }}
        />
      )}

      {/* ── Join Workspace with Code Modal ───────────────────────────────── */}
      {showJoinModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowJoinModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100 shadow-2xs">
              <LinkIcon size={22} />
            </div>
            <h2 className="text-lg font-extrabold text-slate-800 mb-1">
              Tham gia bằng Mã mời
            </h2>
            <p className="text-xs text-slate-500 font-medium mb-5">
              Nhập mã mời (ví dụ: <code className="bg-slate-100 px-1.5 py-0.5 rounded-md font-mono text-indigo-600 font-bold">A1B2C3D4</code>) hoặc dán toàn bộ đường dẫn mời công khai.
            </p>

            <form onSubmit={handleJoinByCode} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Nhập mã mời hoặc dán đường dẫn..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  autoFocus
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!joinCode.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 transition-colors disabled:opacity-50"
                >
                  Tiếp tục →
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

