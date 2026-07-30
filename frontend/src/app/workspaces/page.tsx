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
  Link as LinkIcon
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
    // Nếu dán cả đường dẫn https://domain/join-workspace/ABCDEF12 -> lấy phần cuối
    if (code.includes("/join-workspace/")) {
      const parts = code.split("/join-workspace/");
      code = parts[parts.length - 1].replace(/\//g, "");
    }

    router.push(`/join-workspace/${code}`);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Nhóm làm việc</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cộng tác và chat nhóm với đồng nghiệp
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors border border-slate-200"
          >
            <LinkIcon size={15} className="text-indigo-600" />
            Tham gia bằng mã
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-colors"
          >
            <Plus size={15} />
            Tạo nhóm mới
          </button>
        </div>
      </div>

      <div className="px-8 py-6 max-w-4xl mx-auto">
        {/* Search */}
        <div className="relative mb-6">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm nhóm làm việc..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="text-indigo-400 animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
              <Users size={26} className="text-indigo-300" />
            </div>
            <p className="font-semibold text-slate-500 text-sm">
              {search ? "Không tìm thấy nhóm nào" : "Chưa có nhóm làm việc"}
            </p>
            <p className="text-slate-400 text-xs mt-1">
              {!search && "Hãy tạo nhóm đầu tiên để bắt đầu cộng tác"}
            </p>
          </div>
        )}

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((ws, i) => {
            const isOwner = ws.ownerId === currentUserId || ws.ownerId?._id === currentUserId;
            const memberCount = ws.members?.length || 0;

            return (
              <motion.div
                key={ws._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer relative"
                onClick={() => router.push(`/workspaces/${ws._id}/chat`)}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm overflow-hidden">
                      {ws.avatar ? (
                        <img src={ws.avatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        ws.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        {ws.name}
                        {isOwner && (
                          <Crown size={11} className="text-amber-400" />
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {memberCount} thành viên
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWorkspace(ws);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Cài đặt & Mã mời"
                    >
                      <Settings size={15} />
                    </button>
                    <ChevronRight
                      size={15}
                      className="text-slate-300 group-hover:text-indigo-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Description */}
                {ws.description && (
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
                    {ws.description}
                  </p>
                )}

                {/* Member Avatars + Chat CTA */}
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-1.5">
                    {ws.members?.slice(0, 5).map((m: any, j: number) => (
                      <div
                        key={j}
                        className="w-6 h-6 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center text-[9px] text-white font-bold"
                        title={m.user?.username}
                      >
                        {(m.user?.username || "?").charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {memberCount > 5 && (
                      <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[9px] text-slate-500 font-bold">
                        +{memberCount - 5}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-500 group-hover:text-indigo-600 transition-colors">
                    <MessageSquare size={12} />
                    Mở chat
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Create Workspace Modal ─────────────────────────────────────────── */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-slate-800 mb-1">
              Tạo nhóm làm việc mới
            </h2>
            <p className="text-sm text-slate-400 mb-5">
              Nhóm làm việc giúp bạn cộng tác và chia sẻ tài liệu với đồng nghiệp.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Tên nhóm <span className="text-red-400">*</span>
                </label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="VD: Dự án ABC, Phòng Kế toán..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Mô tả ngắn gọn về mục đích của nhóm..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating || !newName.trim()}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  "Tạo nhóm"
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
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowJoinModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <LinkIcon size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">
              Tham gia bằng Mã mời
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Nhập mã mời (ví dụ: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-600">A1B2C3D4</code>) hoặc dán toàn bộ đường dẫn mời công khai.
            </p>

            <form onSubmit={handleJoinByCode} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Nhập mã mời hoặc dán đường dẫn..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  autoFocus
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!joinCode.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
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
