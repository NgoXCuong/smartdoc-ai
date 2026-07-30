"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Users, FileText, Settings, Loader2 } from "lucide-react";
import Link from "next/link";
import { workspaceApi } from "@/services/api";
import GroupChatPanel from "@/components/chat/GroupChatPanel";
import WorkspaceModal from "@/components/chat/WorkspaceModal";
import { toast } from "react-hot-toast";

export default function WorkspaceChatPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.id as string;

  const [workspace, setWorkspace] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/auth");
      return;
    }
    setCurrentUser(JSON.parse(stored));
  }, [router]);

  useEffect(() => {
    if (!workspaceId || !currentUser) return;
    fetchWorkspace();
  }, [workspaceId, currentUser]);

  const fetchWorkspace = async () => {
    setIsLoading(true);
    try {
      const res = await workspaceApi.getById(workspaceId);
      setWorkspace(res.data.workspace);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể tải workspace");
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!workspace) return null;

  const memberCount = workspace.members?.length || 0;
  const currentUserId = currentUser._id || currentUser.id;
  const isOwner = workspace.ownerId === currentUserId || workspace.ownerId?._id === currentUserId;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium"
            >
              <ArrowLeft size={15} />
              Quay lại
            </Link>

            <div className="h-5 w-px bg-slate-200" />

            <div>
              <h1 className="font-bold text-slate-800 text-base leading-tight">
                {workspace.name}
              </h1>
              {workspace.description && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {workspace.description}
                </p>
              )}
            </div>
          </div>

          {/* Workspace Meta */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Users size={13} className="text-slate-400" />
              {memberCount} thành viên
            </div>

            {/* Member Avatars */}
            <div className="flex -space-x-2">
              {workspace.members?.slice(0, 4).map((m: any, i: number) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold shadow-sm"
                  title={m.user?.username || m.user?.email}
                >
                  {(m.user?.username || m.user?.email || "?")
                    .charAt(0)
                    .toUpperCase()}
                </div>
              ))}
              {memberCount > 4 && (
                <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] text-slate-500 font-bold">
                  +{memberCount - 4}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 p-6 max-w-5xl mx-auto w-full flex flex-col gap-0"
        >
          <GroupChatPanel
            workspaceId={workspaceId}
            workspaceName={workspace.name}
            currentUserId={currentUserId}
          />
        </motion.div>

        {/* ── Right Sidebar: Workspace Info ─────────────────────────────────── */}
        <div className="hidden xl:flex w-64 shrink-0 flex-col gap-4 p-4 pr-6 overflow-y-auto">
          {/* Members List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users size={13} className="text-slate-400" />
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Thành viên ({memberCount})
                </h3>
              </div>
              {isOwner && (
                <button
                  onClick={() => setShowWorkspaceModal(true)}
                  className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                  title="Quản lý Tổ chức"
                >
                  <Settings size={14} />
                </button>
              )}
            </div>
            <div className="space-y-2.5">
              {workspace.members?.map((m: any, i: number) => {
                const u = m.user;
                const isMe = u?._id === currentUserId;
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                      {(u?.username || u?.email || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">
                        {u?.username || "Ẩn danh"}
                        {isMe && (
                          <span className="text-slate-400 font-normal">
                            {" "}(bạn)
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {m.role === "admin" ? "👑 Admin" : m.role === "editor" ? "✏️ Editor" : "👁 Viewer"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Tips Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-4">
            <h3 className="text-xs font-bold text-indigo-700 mb-2">
              💡 Mẹo dùng @AI
            </h3>
            <ul className="space-y-1.5 text-[11px] text-indigo-600">
              <li>• Gõ <code className="bg-indigo-100 px-1 rounded font-mono">@AI tóm tắt hợp đồng</code></li>
              <li>• Gõ <code className="bg-indigo-100 px-1 rounded font-mono">@AI điều khoản quan trọng</code></li>
              <li>• Gõ <code className="bg-indigo-100 px-1 rounded font-mono">@AI so sánh 2 tài liệu</code></li>
            </ul>
            <p className="text-[10px] text-indigo-400 mt-2.5">
              AI sẽ tìm kiếm trong tất cả tài liệu của workspace.
            </p>
          </div>
        </div>
      </div>

      {showWorkspaceModal && (
        <WorkspaceModal
          workspace={workspace}
          onClose={() => setShowWorkspaceModal(false)}
          onSuccess={() => {
            setShowWorkspaceModal(false);
            fetchWorkspace();
          }}
        />
      )}
    </div>
  );
}
