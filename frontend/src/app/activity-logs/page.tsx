"use client";

import React, { useEffect, useState, useCallback } from "react";
import { activityLogApi, workspaceApi } from "@/services/api";
import {
  History,
  FileUp,
  Trash2,
  Share2,
  FolderPlus,
  UserPlus,
  Building2,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ActivityLogItem {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  workspaceId?: {
    _id: string;
    name: string;
  };
  action: string;
  targetId?: string;
  targetType?: string;
  details?: any;
  ip?: string;
  createdAt: string;
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const router = useRouter();

  const fetchWorkspaces = useCallback(async () => {
    try {
      const res = await workspaceApi.getAll();
      setWorkspaces(res.data.workspaces || []);
    } catch (e) {
      console.error("Lỗi lấy danh sách workspace:", e);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await activityLogApi.getAll(
        page,
        20,
        selectedWorkspaceId || null,
        actionFilter || undefined
      );
      setLogs(res.data.logs || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error("Lỗi lấy nhật ký hoạt động:", e);
    } finally {
      setLoading(false);
    }
  }, [page, selectedWorkspaceId, actionFilter]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "UPLOAD_FILE":
        return {
          label: "Tải lên tài liệu",
          icon: <FileUp size={14} />,
          color: "bg-emerald-50 text-emerald-600 border-emerald-200",
        };
      case "DELETE_FILE":
        return {
          label: "Xóa tài liệu",
          icon: <Trash2 size={14} />,
          color: "bg-rose-50 text-rose-600 border-rose-200",
        };
      case "SHARE_DOC":
        return {
          label: "Chia sẻ tài liệu",
          icon: <Share2 size={14} />,
          color: "bg-blue-50 text-blue-600 border-blue-200",
        };
      case "CREATE_WORKSPACE":
        return {
          label: "Tạo Workspace",
          icon: <Building2 size={14} />,
          color: "bg-purple-50 text-purple-600 border-purple-200",
        };
      case "JOIN_WORKSPACE":
        return {
          label: "Thành viên gia nhập",
          icon: <UserPlus size={14} />,
          color: "bg-indigo-50 text-indigo-600 border-indigo-200",
        };
      case "CREATE_FOLDER":
        return {
          label: "Tạo thư mục",
          icon: <FolderPlus size={14} />,
          color: "bg-amber-50 text-amber-600 border-amber-200",
        };
      default:
        return {
          label: action,
          icon: <History size={14} />,
          color: "bg-slate-50 text-slate-600 border-slate-200",
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-100 transition-colors shadow-sm"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                <History size={26} className="text-blue-600" />
                Nhật ký Hoạt động (Audit Logs)
              </h1>
              <p className="text-slate-500 text-sm font-medium mt-0.5">
                Theo dõi tất cả lịch sử thao tác của người dùng và các thành viên trong hệ thống SmartDoc AI.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm text-sm font-semibold text-slate-700">
            <ShieldAlert size={16} className="text-blue-600" />
            <span>Tổng cộng {total} ghi nhận</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Filter by Workspace */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl">
              <Building2 size={16} className="text-slate-400" />
              <select
                value={selectedWorkspaceId}
                onChange={(e) => {
                  setSelectedWorkspaceId(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent border-none outline-none text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="">Tất cả Không gian</option>
                {workspaces.map((ws) => (
                  <option key={ws._id} value={ws._id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Action */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl">
              <Filter size={16} className="text-slate-400" />
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent border-none outline-none text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="">Tất cả Hành động</option>
                <option value="UPLOAD_FILE">Tải lên tài liệu</option>
                <option value="DELETE_FILE">Xóa tài liệu</option>
                <option value="SHARE_DOC">Chia sẻ tài liệu</option>
                <option value="CREATE_WORKSPACE">Tạo Workspace</option>
                <option value="JOIN_WORKSPACE">Thành viên gia nhập</option>
                <option value="CREATE_FOLDER">Tạo thư mục</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logs Table / List */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-semibold">Đang tải nhật ký hoạt động...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center">
              <History size={40} className="text-slate-300 mb-3" />
              <p className="text-base font-bold text-slate-700">Chưa có nhật ký ghi nhận</p>
              <p className="text-xs text-slate-400 mt-1">Các thao tác trên hệ thống sẽ tự động hiển thị tại đây.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">Người thực hiện</th>
                    <th className="px-6 py-4">Hành động</th>
                    <th className="px-6 py-4">Chi tiết đối tượng</th>
                    <th className="px-6 py-4">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {logs.map((log) => {
                    const badge = getActionBadge(log.action);
                    return (
                      <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                        {/* User Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                              {log.userId?.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-xs line-clamp-1">
                                {log.userId?.name || "Người dùng"}
                              </p>
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                {log.userId?.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Action Badge */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.color}`}
                          >
                            {badge.icon}
                            {badge.label}
                          </span>
                        </td>

                        {/* Details */}
                        <td className="px-6 py-4">
                          <div className="text-xs text-slate-700 max-w-xs font-medium">
                            {log.details?.fileName && (
                              <p className="font-semibold text-slate-900 truncate">
                                File: {log.details.fileName}
                              </p>
                            )}
                            {log.details?.name && (
                              <p className="font-semibold text-slate-900 truncate">
                                Workspace: {log.details.name}
                              </p>
                            )}
                            {log.details?.targetEmail && (
                              <p className="text-slate-500">
                                Email: {log.details.targetEmail} ({log.details.permission})
                              </p>
                            )}
                            {log.details?.memberEmail && (
                              <p className="text-slate-500">
                                Thêm: {log.details.memberEmail}
                              </p>
                            )}
                            {log.workspaceId?.name && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                                {log.workspaceId.name}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Timestamp & IP */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                            <Calendar size={13} className="text-slate-400" />
                            {new Date(log.createdAt).toLocaleString("vi-VN")}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs font-semibold text-slate-500">
                Trang {page} / {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-100 transition-all shadow-sm"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-100 transition-all shadow-sm"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
