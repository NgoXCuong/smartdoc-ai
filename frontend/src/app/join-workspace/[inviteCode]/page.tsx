"use client";

import React, { useEffect, useState, use } from "react";
import { workspaceApi } from "@/services/api";
import { useRouter } from "next/navigation";
import { Building2, Users, UserCheck, ShieldCheck, ArrowRight, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";

export default function JoinWorkspacePage({ params }: { params: Promise<{ inviteCode: string }> }) {
  const resolvedParams = use(params);
  const inviteCode = resolvedParams.inviteCode;

  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchWorkspaceInfo = async () => {
      try {
        const res = await workspaceApi.getByInviteCode(inviteCode);
        setWorkspace(res.data.workspace);
      } catch (err: any) {
        setError(err.response?.data?.message || "Mã mời không hợp lệ hoặc đã hết hạn.");
      } finally {
        setLoading(false);
      }
    };

    if (inviteCode) {
      fetchWorkspaceInfo();
    }
  }, [inviteCode]);

  const handleJoin = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Vui lòng đăng nhập để tham gia nhóm!");
      router.push(`/auth?redirect=/join-workspace/${inviteCode}`);
      return;
    }

    setJoining(true);
    const toastId = toast.loading("Đang gia nhập nhóm...");

    try {
      const res = await workspaceApi.joinByInviteCode(inviteCode);
      toast.success("Gia nhập Không gian làm việc thành công!", { id: toastId });
      const wsId = res.data.workspace._id;
      router.push(`/workspaces/${wsId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi gia nhập nhóm", { id: toastId });
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold text-slate-600">Đang kiểm tra mã mời...</p>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 mb-2">Mã mời không khả dụng</h2>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all text-sm shadow-md"
          >
            Quay về Trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-lg w-full bg-white/95 backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-white/20 shadow-2xl relative z-10 text-center">
        {/* Workspace Avatar Icon */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20 text-3xl font-black uppercase border-4 border-white">
          {workspace.avatar ? (
            <img src={workspace.avatar} alt="Avatar" className="w-full h-full object-cover rounded-3xl" />
          ) : (
            workspace.name?.charAt(0) || <Building2 size={36} />
          )}
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-extrabold text-xs mb-3 border border-blue-100">
          <Sparkles size={14} />
          <span>Lời mời gia nhập Workspace</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 tracking-tight">
          {workspace.name}
        </h1>

        {workspace.description && (
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            {workspace.description}
          </p>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl mb-8 border border-slate-100 text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm border border-slate-100 shrink-0">
              <UserCheck size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chủ nhóm</p>
              <p className="text-xs font-bold text-slate-800 truncate">{workspace.owner?.name || "Ẩn danh"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-purple-600 shadow-sm border border-slate-100 shrink-0">
              <Users size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thành viên</p>
              <p className="text-xs font-bold text-slate-800">{workspace.memberCount} thành viên</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleJoin}
          disabled={joining}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 text-base disabled:opacity-50"
        >
          {joining ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              Gia nhập Không gian làm việc
              <ArrowRight size={20} />
            </>
          )}
        </button>

        <p className="text-xs text-slate-400 mt-4">
          Bằng việc tham gia, bạn sẽ có thể chia sẻ tài liệu và thảo luận cùng các thành viên trong nhóm.
        </p>
      </div>
    </div>
  );
}
