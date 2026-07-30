"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
  Bot,
  Brain,
  LogIn,
  KeyRound,
  X,
  Laptop,
  Globe,
  Info,
  Clock,
  User,
  FileText,
  ChevronDown,
  Check
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ActivityLogItem {
  _id: string;
  userId: {
    _id: string;
    username?: string;
    name?: string;
    email: string;
    avatarUrl?: string;
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
  userAgent?: string;
  createdAt: string;
}

const ACTION_OPTIONS = [
  { value: "", label: "Tất cả Hành động", icon: Filter },
  { value: "RAG_QUERY", label: "Truy vấn AI (RAG)", icon: Bot },
  { value: "INDEX_DOC", label: "Lập chỉ mục Semantic", icon: Brain },
  { value: "UPLOAD_FILE", label: "Tải lên tài liệu", icon: FileUp },
  { value: "SHARE_DOC", label: "Chia sẻ tài liệu", icon: Share2 },
  { value: "DELETE_FILE", label: "Xóa tài liệu", icon: Trash2 },
  { value: "CREATE_WORKSPACE", label: "Tạo Workspace", icon: Building2 },
  { value: "JOIN_WORKSPACE", label: "Tham gia nhóm", icon: UserPlus },
  { value: "CREATE_FOLDER", label: "Tạo thư mục", icon: FolderPlus },
  { value: "LOGIN", label: "Đăng nhập hệ thống", icon: LogIn },
  { value: "CHANGE_PASSWORD", label: "Đổi mật khẩu", icon: KeyRound },
];

const TIME_OPTIONS = [
  { value: "ALL", label: "Tất cả thời gian", icon: Calendar },
  { value: "TODAY", label: "Hôm nay", icon: Clock },
  { value: "7DAYS", label: "7 ngày qua", icon: Calendar },
  { value: "30DAYS", label: "30 ngày qua", icon: Calendar },
];

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("ALL");
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);

  // Popover Dropdown Open States
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);

  // Popover Dropdown Refs
  const workspaceRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workspaceRef.current && !workspaceRef.current.contains(event.target as Node)) {
        setIsWorkspaceOpen(false);
      }
      if (actionRef.current && !actionRef.current.contains(event.target as Node)) {
        setIsActionOpen(false);
      }
      if (timeRef.current && !timeRef.current.contains(event.target as Node)) {
        setIsTimeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        1,
        100,
        selectedWorkspaceId || null,
        actionFilter || undefined
      );
      setLogs(res.data.logs || []);
    } catch (e) {
      console.error("Lỗi lấy nhật ký hoạt động từ backend:", e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [selectedWorkspaceId, actionFilter]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Bộ lọc Client-side thông minh trên dữ liệu thật
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const displayName = log.userId?.username || log.userId?.name || "";
      
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const userName = displayName.toLowerCase();
        const userEmail = log.userId?.email?.toLowerCase() || "";
        const fileName = log.details?.fileName?.toLowerCase() || "";
        const wsName = log.workspaceId?.name?.toLowerCase() || log.details?.name?.toLowerCase() || "";
        const action = log.action.toLowerCase();
        const matches = userName.includes(q) || userEmail.includes(q) || fileName.includes(q) || wsName.includes(q) || action.includes(q);
        if (!matches) return false;
      }

      // 2. Action Filter
      if (actionFilter && log.action !== actionFilter) {
        return false;
      }

      // 3. Workspace Filter
      if (selectedWorkspaceId && log.workspaceId?._id !== selectedWorkspaceId) {
        return false;
      }

      // 4. Time Range Filter
      if (timeFilter !== "ALL") {
        const logDate = new Date(log.createdAt).getTime();
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (timeFilter === "TODAY" && now - logDate > oneDay) return false;
        if (timeFilter === "7DAYS" && now - logDate > 7 * oneDay) return false;
        if (timeFilter === "30DAYS" && now - logDate > 30 * oneDay) return false;
      }

      return true;
    });
  }, [logs, searchQuery, actionFilter, selectedWorkspaceId, timeFilter]);

  // Phân trang
  const totalItems = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, page, pageSize]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "RAG_QUERY":
      case "CHAT_AI":
        return {
          label: "Truy vấn AI (RAG)",
          icon: <Bot size={13} />,
          color: "bg-indigo-50 text-indigo-700 border-indigo-200",
        };
      case "INDEX_DOC":
      case "RAG_INDEX":
        return {
          label: "Semantic Indexing",
          icon: <Brain size={13} />,
          color: "bg-purple-50 text-purple-700 border-purple-200",
        };
      case "UPLOAD_FILE":
      case "DOCUMENT_UPLOAD":
        return {
          label: "Tải lên tài liệu",
          icon: <FileUp size={13} />,
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "DELETE_FILE":
        return {
          label: "Xóa tài liệu",
          icon: <Trash2 size={13} />,
          color: "bg-rose-50 text-rose-700 border-rose-200",
        };
      case "SHARE_DOC":
        return {
          label: "Chia sẻ tài liệu",
          icon: <Share2 size={13} />,
          color: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "CREATE_WORKSPACE":
        return {
          label: "Tạo Workspace",
          icon: <Building2 size={13} />,
          color: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "JOIN_WORKSPACE":
        return {
          label: "Tham gia nhóm",
          icon: <UserPlus size={13} />,
          color: "bg-sky-50 text-sky-700 border-sky-200",
        };
      case "CREATE_FOLDER":
        return {
          label: "Tạo thư mục",
          icon: <FolderPlus size={13} />,
          color: "bg-teal-50 text-teal-700 border-teal-200",
        };
      case "LOGIN":
      case "AUTH_LOGIN":
        return {
          label: "Đăng nhập hệ thống",
          icon: <LogIn size={13} />,
          color: "bg-slate-100 text-slate-700 border-slate-200",
        };
      case "CHANGE_PASSWORD":
        return {
          label: "Đổi mật khẩu",
          icon: <KeyRound size={13} />,
          color: "bg-orange-50 text-orange-700 border-orange-200",
        };
      default:
        return {
          label: action,
          icon: <History size={13} />,
          color: "bg-slate-50 text-slate-600 border-slate-200",
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-100 transition-colors shadow-2xs"
            >
              <ArrowLeft size={18} className="text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
                <History size={24} className="text-blue-600" />
                Nhật ký Hoạt động (Audit Logs)
              </h1>
              <p className="text-slate-500 text-xs font-semibold mt-0.5">
                Theo dõi và kiểm soát toàn bộ lịch sử thao tác từ dữ liệu thực của người dùng & hệ thống.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs text-xs font-bold text-slate-700">
            <ShieldAlert size={15} className="text-blue-600" />
            <span>Tổng cộng {totalItems} ghi nhận</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
            
            {/* 1. Realtime Search Input */}
            <div className="md:col-span-4 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Tìm theo người dùng, file, workspace..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* 2. Custom Workspace Popover Dropdown */}
            <div className="md:col-span-3 relative" ref={workspaceRef}>
              <button
                type="button"
                onClick={() => {
                  setIsWorkspaceOpen(!isWorkspaceOpen);
                  setIsActionOpen(false);
                  setIsTimeOpen(false);
                }}
                className="w-full flex items-center justify-between gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  {selectedWorkspaceId === "" ? (
                    <Globe size={15} className="text-slate-400 shrink-0" />
                  ) : selectedWorkspaceId === "PERSONAL" ? (
                    <User size={15} className="text-slate-400 shrink-0" />
                  ) : (
                    <Building2 size={15} className="text-slate-400 shrink-0" />
                  )}
                  <span className="truncate">
                    {selectedWorkspaceId === ""
                      ? "Tất cả Không gian"
                      : selectedWorkspaceId === "PERSONAL"
                      ? "Không gian Cá nhân"
                      : workspaces.find((w) => w._id === selectedWorkspaceId)?.name || "Không gian làm việc"}
                  </span>
                </div>
                <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isWorkspaceOpen ? "rotate-180" : ""}`} />
              </button>

              {isWorkspaceOpen && (
                <div className="absolute top-full mt-2 left-0 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 overflow-hidden text-xs font-bold text-slate-700">
                  <button
                    onClick={() => {
                      setSelectedWorkspaceId("");
                      setPage(1);
                      setIsWorkspaceOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-blue-50/60 hover:text-blue-600 transition-colors ${
                      selectedWorkspaceId === "" ? "text-blue-600 bg-blue-50/80 font-extrabold" : "text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe size={16} className={selectedWorkspaceId === "" ? "text-blue-600" : "text-slate-400"} />
                      <span>Tất cả Không gian</span>
                    </div>
                    {selectedWorkspaceId === "" && <Check size={14} className="text-blue-600" />}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedWorkspaceId("PERSONAL");
                      setPage(1);
                      setIsWorkspaceOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-blue-50/60 hover:text-blue-600 transition-colors ${
                      selectedWorkspaceId === "PERSONAL" ? "text-blue-600 bg-blue-50/80 font-extrabold" : "text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <User size={16} className={selectedWorkspaceId === "PERSONAL" ? "text-blue-600" : "text-slate-400"} />
                      <span>Không gian Cá nhân</span>
                    </div>
                    {selectedWorkspaceId === "PERSONAL" && <Check size={14} className="text-blue-600" />}
                  </button>

                  {workspaces.map((ws) => {
                    const isSelected = selectedWorkspaceId === ws._id;
                    return (
                      <button
                        key={ws._id}
                        onClick={() => {
                          setSelectedWorkspaceId(ws._id);
                          setPage(1);
                          setIsWorkspaceOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-blue-50/60 hover:text-blue-600 transition-colors border-t border-slate-50 ${
                          isSelected ? "text-blue-600 bg-blue-50/80 font-extrabold" : "text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Building2 size={16} className={isSelected ? "text-blue-600" : "text-slate-400"} />
                          <span className="truncate">{ws.name}</span>
                        </div>
                        {isSelected && <Check size={14} className="text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Custom Action Popover Dropdown */}
            <div className="md:col-span-3 relative" ref={actionRef}>
              <button
                type="button"
                onClick={() => {
                  setIsActionOpen(!isActionOpen);
                  setIsWorkspaceOpen(false);
                  setIsTimeOpen(false);
                }}
                className="w-full flex items-center justify-between gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <Filter size={15} className="text-slate-400 shrink-0" />
                  <span className="truncate">
                    {ACTION_OPTIONS.find((a) => a.value === actionFilter)?.label || "Tất cả Hành động"}
                  </span>
                </div>
                <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isActionOpen ? "rotate-180" : ""}`} />
              </button>

              {isActionOpen && (
                <div className="absolute top-full mt-2 left-0 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 max-h-80 overflow-y-auto text-xs font-bold text-slate-700">
                  {ACTION_OPTIONS.map((opt) => {
                    const IconComp = opt.icon;
                    const isSelected = actionFilter === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setActionFilter(opt.value);
                          setPage(1);
                          setIsActionOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-blue-50/60 hover:text-blue-600 transition-colors ${
                          isSelected ? "text-blue-600 bg-blue-50/80 font-extrabold" : "text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <IconComp size={16} className={isSelected ? "text-blue-600" : "text-slate-400"} />
                          <span>{opt.label}</span>
                        </div>
                        {isSelected && <Check size={14} className="text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. Custom Time Range Popover Dropdown */}
            <div className="md:col-span-2 relative" ref={timeRef}>
              <button
                type="button"
                onClick={() => {
                  setIsTimeOpen(!isTimeOpen);
                  setIsWorkspaceOpen(false);
                  setIsActionOpen(false);
                }}
                className="w-full flex items-center justify-between gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <Calendar size={15} className="text-slate-400 shrink-0" />
                  <span className="truncate">
                    {TIME_OPTIONS.find((t) => t.value === timeFilter)?.label || "Tất cả thời gian"}
                  </span>
                </div>
                <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isTimeOpen ? "rotate-180" : ""}`} />
              </button>

              {isTimeOpen && (
                <div className="absolute top-full mt-2 left-0 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 overflow-hidden text-xs font-bold text-slate-700">
                  {TIME_OPTIONS.map((opt) => {
                    const IconComp = opt.icon;
                    const isSelected = timeFilter === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setTimeFilter(opt.value);
                          setPage(1);
                          setIsTimeOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-blue-50/60 hover:text-blue-600 transition-colors ${
                          isSelected ? "text-blue-600 bg-blue-50/80 font-extrabold" : "text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <IconComp size={16} className={isSelected ? "text-blue-600" : "text-slate-400"} />
                          <span>{opt.label}</span>
                        </div>
                        {isSelected && <Check size={14} className="text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center">
              <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-semibold">Đang truy xuất nhật ký audit từ cơ sở dữ liệu...</p>
            </div>
          ) : paginatedLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center">
              <History size={36} className="text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">Chưa có nhật ký hoạt động nào</p>
              <p className="text-xs text-slate-400 mt-1">Các thao tác trên hệ thống sẽ tự động được ghi nhận tại đây.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3.5">Người thực hiện</th>
                    <th className="px-5 py-3.5">Hành động</th>
                    <th className="px-5 py-3.5">Đối tượng tác động</th>
                    <th className="px-5 py-3.5 text-right">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedLogs.map((log) => {
                    const badge = getActionBadge(log.action);
                    const userName = log.userId?.username || log.userId?.name || "Người dùng";
                    const userEmail = log.userId?.email || "";
                    const avatarUrl = log.userId?.avatarUrl;

                    return (
                      <tr 
                        key={log._id} 
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                      >
                        {/* User Info */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-2xs shrink-0 overflow-hidden">
                              {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                userName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-800 text-xs group-hover:text-blue-600 transition-colors">
                                {userName}
                              </p>
                              {userEmail && (
                                <p className="text-[11px] text-slate-400 font-medium">
                                  {userEmail}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Action Badge */}
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badge.color}`}
                          >
                            {badge.icon}
                            {badge.label}
                          </span>
                        </td>

                        {/* Details */}
                        <td className="px-5 py-3.5">
                          <div className="text-xs text-slate-700 font-medium max-w-sm">
                            {log.details?.fileName && (
                              <p className="font-bold text-slate-800 truncate flex items-center gap-1.5">
                                <FileText size={13} className="text-slate-400 shrink-0" />
                                <span>{log.details.fileName}</span>
                              </p>
                            )}
                            {log.details?.name && (
                              <p className="font-bold text-slate-800 truncate flex items-center gap-1.5">
                                <Building2 size={13} className="text-slate-400 shrink-0" />
                                <span>{log.details.name}</span>
                              </p>
                            )}
                            {log.details?.query && (
                              <p className="text-slate-500 italic truncate text-[11px] mt-0.5">
                                "{log.details.query}"
                              </p>
                            )}
                            {log.details?.targetEmail && (
                              <p className="text-slate-500 text-[11px] mt-0.5">
                                Gửi: {log.details.targetEmail}
                              </p>
                            )}
                            {log.workspaceId?.name && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-extrabold">
                                {log.workspaceId.name}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Timestamp */}
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-slate-500">
                            <Clock size={12} className="text-slate-400" />
                            {new Date(log.createdAt).toLocaleString("vi-VN", {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 gap-3">
              <span className="text-xs font-semibold text-slate-500">
                Hiển thị {Math.min((page - 1) * pageSize + 1, totalItems)}–{Math.min(page * pageSize, totalItems)} / {totalItems} bản ghi
              </span>
              
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold disabled:opacity-40 hover:bg-slate-100 transition-all shadow-2xs flex items-center gap-1"
                >
                  <ChevronLeft size={14} /> Trước
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                      page === p
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold disabled:opacity-40 hover:bg-slate-100 transition-all shadow-2xs flex items-center gap-1"
                >
                  Sau <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Audit Detail Modal Panel */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Info size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Chi tiết nhật ký hoạt động</h3>
                  <p className="text-[11px] text-slate-400 font-mono">ID: {selectedLog._id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* User Block */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm overflow-hidden">
                  {selectedLog.userId?.avatarUrl ? (
                    <img src={selectedLog.userId.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    (selectedLog.userId?.username || selectedLog.userId?.name || "U").charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Người thực hiện</p>
                  <p className="font-extrabold text-slate-800 text-sm">
                    {selectedLog.userId?.username || selectedLog.userId?.name || "Người dùng"}
                  </p>
                  {selectedLog.userId?.email && (
                    <p className="text-xs text-slate-500 font-medium">{selectedLog.userId.email}</p>
                  )}
                </div>
              </div>

              {/* Grid Properties */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-bold block mb-1">Hành động</span>
                  <span className="font-extrabold text-blue-600">
                    {getActionBadge(selectedLog.action).label}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-bold block mb-1">Thời gian</span>
                  <span className="font-semibold text-slate-700">
                    {new Date(selectedLog.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-bold block mb-1">Địa chỉ IP</span>
                  <span className="font-mono text-slate-700 font-bold flex items-center gap-1">
                    <Globe size={12} className="text-slate-400" />
                    {selectedLog.ip || "Hệ thống ghi nhận"}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-bold block mb-1">Không gian (Workspace)</span>
                  <span className="font-bold text-slate-700">
                    {selectedLog.workspaceId?.name || "Cá nhân / Toàn hệ thống"}
                  </span>
                </div>
              </div>

              {/* User Agent */}
              {selectedLog.userAgent && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 font-bold block mb-1 flex items-center gap-1">
                    <Laptop size={12} /> Trình duyệt & Thiết bị (User Agent)
                  </span>
                  <span className="font-mono text-[11px] text-slate-600 break-all">
                    {selectedLog.userAgent}
                  </span>
                </div>
              )}

              {/* Details JSON */}
              {selectedLog.details && (
                <div className="bg-slate-900 text-slate-200 p-3.5 rounded-2xl text-xs font-mono">
                  <span className="text-slate-400 block mb-1 text-[10px] uppercase font-bold tracking-wider">Chi tiết Payload metadata:</span>
                  <pre className="whitespace-pre-wrap text-[11px]">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-xl text-xs transition-all active:scale-95 shadow-2xs"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}



