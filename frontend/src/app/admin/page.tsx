"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  FileText, 
  MessageSquare, 
  AlertCircle,
  ShieldCheck,
  Loader2,
  Search,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Server,
  Database,
  Workflow,
  Clock,
  UserCheck,
  UserX,
  Trash2,
  Activity,
  Zap,
  Layers3
} from "lucide-react";
import { adminApi } from "@/services/api";
import { toast } from "react-hot-toast";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

// Dữ liệu mô phỏng theo giờ / ngày cho Hiệu suất hệ thống
const PERFORMANCE_HOURLY = [
  { time: "00:00", requests: 12, responseTime: 1.1 },
  { time: "04:00", requests: 8, responseTime: 1.0 },
  { time: "08:00", requests: 45, responseTime: 1.4 },
  { time: "12:00", requests: 62, responseTime: 1.6 },
  { time: "16:00", requests: 50, responseTime: 1.3 },
  { time: "20:00", requests: 28, responseTime: 1.2 },
];

const DEFAULT_RECENT_ACTIVITIES = [
  { _id: "1", action: "RAG_QUERY", user: "Yến Nhi", email: "yennhi@smartdoc.ai", target: "Tài liệu Hướng dẫn RAG.pdf", time: "10 phút trước", status: "success" },
  { _id: "2", action: "UPLOAD_FILE", user: "Xuân Cường", email: "xuancuong@smartdoc.ai", target: "Báo cáo Kỹ thuật 2026.docx", time: "25 phút trước", status: "success" },
  { _id: "3", action: "CHAT_AI", user: "Yến Nhi", email: "yennhi@smartdoc.ai", target: "Trợ lý AI SmartDoc", time: "1 giờ trước", status: "success" },
  { _id: "4", action: "CREATE_WORKSPACE", user: "Xuân Cường", email: "xuancuong@smartdoc.ai", target: "Dự án RAG Observability", time: "2 giờ trước", status: "success" },
  { _id: "5", action: "INDEX_DOC", user: "Hệ thống", email: "system@smartdoc.ai", target: "Vector Database Indexing", time: "3 giờ trước", status: "success" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>(DEFAULT_RECENT_ACTIVITIES);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [perfTimeframe, setPerfTimeframe] = useState("24h");

  // Menu thao tác đang mở
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/auth");
      return;
    }
    
    const user = JSON.parse(userStr);
    setCurrentUser(user);
    if (user.role !== "admin") {
      toast.error("Bạn không có quyền truy cập trang này!");
      router.push("/");
      return;
    }

    fetchAdminData();
  }, [router]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers()
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
      if (statsRes.data.recentActivities && statsRes.data.recentActivities.length > 0) {
        setRecentActivities(statsRes.data.recentActivities);
      }
    } catch (error: any) {
      toast.error("Lỗi khi tải dữ liệu Admin: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (u: any) => {
    setActiveMenuUserId(null);
    if (u._id === currentUser?._id) {
      toast.error("Bạn không thể thay đổi vai trò của chính mình!");
      return;
    }

    const newRole = u.role === "admin" ? "user" : "admin";
    const toastId = toast.loading("Đang cập nhật vai trò...");
    try {
      await adminApi.updateUser(u._id, { role: newRole });
      toast.success(`Đã đổi vai trò của ${u.username} thành ${newRole.toUpperCase()}`, { id: toastId });
      setUsers(prev => prev.map(item => item._id === u._id ? { ...item, role: newRole } : item));
    } catch (error: any) {
      toast.error("Lỗi khi cập nhật vai trò: " + (error.response?.data?.message || error.message), { id: toastId });
    }
  };

  const handleToggleStatus = async (u: any) => {
    setActiveMenuUserId(null);
    if (u._id === currentUser?._id) {
      toast.error("Bạn không thể khóa tài khoản của chính mình!");
      return;
    }

    const newActiveState = u.isActive === false ? true : false;
    const toastId = toast.loading("Đang cập nhật trạng thái...");
    try {
      await adminApi.updateUser(u._id, { isActive: newActiveState });
      toast.success(`Đã ${newActiveState ? "mở khóa" : "khóa"} tài khoản ${u.username}`, { id: toastId });
      setUsers(prev => prev.map(item => item._id === u._id ? { ...item, isActive: newActiveState } : item));
    } catch (error: any) {
      toast.error("Lỗi khi cập nhật trạng thái: " + (error.response?.data?.message || error.message), { id: toastId });
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    setActiveMenuUserId(null);
    if (userId === currentUser?._id) {
      toast.error("Bạn không thể xóa tài khoản của chính mình!");
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa người dùng ${username}? Hành động này sẽ xóa toàn bộ dữ liệu của họ.`)) return;

    const toastId = toast.loading("Đang xóa người dùng...");
    try {
      await adminApi.deleteUser(userId);
      toast.success("Đã xóa người dùng thành công", { id: toastId });
      setUsers(users.filter(u => u._id !== userId));
      const statsRes = await adminApi.getStats();
      setStats(statsRes.data.stats);
    } catch (error: any) {
      toast.error("Lỗi khi xóa người dùng: " + (error.response?.data?.message || error.message), { id: toastId });
    }
  };

  // Lọc người dùng theo từ khóa tìm kiếm, vai trò và trạng thái
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchRole = roleFilter === "all" ? true : u.role === roleFilter;
      
      const userActive = u.isActive !== false;
      const matchStatus = statusFilter === "all" ? true : 
                          statusFilter === "active" ? userActive : !userActive;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/50">
        <Loader2 className="animate-spin text-blue-600 mb-3" size={36} />
        <p className="text-xs font-bold text-slate-500">Đang tải dữ liệu Quản trị Hệ thống...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-slate-50/50 min-h-full w-full overflow-y-auto pb-16">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Quản trị */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <ShieldCheck size={26} strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">BẢNG ĐIỀU KHIỂN ADMIN</h1>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Quản lý người dùng, phân quyền, AI và vận hành toàn diện hệ thống.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-800">
            <CheckCircle2 size={16} strokeWidth={2} className="text-emerald-600" />
            <span>Chế độ Quản trị viên đang bật</span>
          </div>
        </div>

        {/* Top 4 Thẻ KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard 
            icon={<Users size={20} className="text-blue-600" />} 
            label="USERS" 
            subLabel="Tổng người dùng"
            value={stats?.totalUsers || users.length || 0} 
            bgColor="bg-blue-50"
          />
          <StatsCard 
            icon={<FileText size={20} className="text-indigo-600" />} 
            label="DOCUMENTS" 
            subLabel="Tổng tài liệu"
            value={stats?.totalDocs || 0} 
            bgColor="bg-indigo-50"
          />
          <StatsCard 
            icon={<MessageSquare size={20} className="text-amber-600" />} 
            label="AI REQUESTS" 
            subLabel="Yêu cầu AI đã xử lý"
            value={stats?.totalRequests || 8} 
            bgColor="bg-amber-50"
          />
          <StatsCard 
            icon={<AlertCircle size={20} className="text-rose-600" />} 
            label="ERROR RATE" 
            subLabel="Tỷ lệ lỗi hệ thống"
            value={stats?.errorRate || "0.8%"} 
            bgColor="bg-rose-50"
          />
        </div>

        {/* Bảng Danh sách Người dùng */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden flex flex-col">
          
          {/* Controls Bar: Search & Filters */}
          <div className="p-6 border-b border-slate-100 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Users size={18} className="text-blue-600" />
                  Danh sách người dùng
                </h2>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  Quản lý phân quyền vai trò và trạng thái tài khoản trong toàn bộ hệ thống
                </p>
              </div>
              <span className="text-xs font-extrabold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl border border-blue-100 self-start md:self-auto">
                {filteredUsers.length} / {users.length} Tài khoản
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
              {/* Input tìm kiếm */}
              <div className="md:col-span-6 relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc email người dùng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Bộ lọc Vai trò */}
              <div className="md:col-span-3">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="all">Vai trò: Tất cả</option>
                  <option value="admin">Vai trò: Admin</option>
                  <option value="user">Vai trò: User</option>
                </select>
              </div>

              {/* Bộ lọc Trạng thái */}
              <div className="md:col-span-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="all">Trạng thái: Tất cả</option>
                  <option value="active">Trạng thái: Hoạt động</option>
                  <option value="locked">Trạng thái: Đã khóa</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Bảng dữ liệu người dùng */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="text-slate-400 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                  <th className="py-3.5 px-6">Tên & Email</th>
                  <th className="py-3.5 px-6">Vai trò</th>
                  <th className="py-3.5 px-6">Trạng thái</th>
                  <th className="py-3.5 px-6">Ngày tham gia</th>
                  <th className="py-3.5 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.map((u, index) => {
                  const isAdmin = u.role === "admin";
                  const isActive = u.isActive !== false;
                  const isSelf = u._id === currentUser?._id;

                  const avatarColors = [
                    "bg-blue-600 text-white", 
                    "bg-indigo-600 text-white", 
                    "bg-purple-600 text-white",
                    "bg-emerald-600 text-white"
                  ];
                  const colorClass = avatarColors[index % avatarColors.length];

                  return (
                    <tr key={u._id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold shadow-2xs ${colorClass}`}>
                            {u.username?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-extrabold text-slate-800 text-xs group-hover:text-blue-600 transition-colors">
                                {u.username}
                              </p>
                              {isSelf && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-medium text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${
                          isAdmin 
                            ? "bg-rose-50 text-rose-700 border-rose-200" 
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-extrabold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Đã khóa
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-slate-500 font-semibold">
                        {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                      </td>

                      <td className="py-4 px-6 text-right relative">
                        <div className="inline-block text-left">
                          <button
                            onClick={() => setActiveMenuUserId(activeMenuUserId === u._id ? null : u._id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Thao tác"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {/* Menu thao tác thả xuống */}
                          {activeMenuUserId === u._id && (
                            <div className="absolute right-6 top-10 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 text-left text-xs font-semibold text-slate-700">
                              <button
                                onClick={() => {
                                  setActiveMenuUserId(null);
                                  toast.success(`Thông tin: ${u.username} (${u.email}) - Vai trò: ${u.role}`);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Search size={14} className="text-slate-400" />
                                Xem chi tiết
                              </button>

                              {!isSelf && (
                                <>
                                  <button
                                    onClick={() => handleToggleRole(u)}
                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <ShieldCheck size={14} className="text-blue-600" />
                                    Đổi thành {u.role === "admin" ? "USER" : "ADMIN"}
                                  </button>

                                  <button
                                    onClick={() => handleToggleStatus(u)}
                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    {isActive ? (
                                      <>
                                        <UserX size={14} className="text-amber-600" />
                                        Khóa tài khoản
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck size={14} className="text-emerald-600" />
                                        Mở khóa tài khoản
                                      </>
                                    )}
                                  </button>

                                  <div className="my-1 border-t border-slate-100"></div>

                                  <button
                                    onClick={() => handleDeleteUser(u._id, u.username)}
                                    className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-bold"
                                  >
                                    <Trash2 size={14} />
                                    Xóa người dùng
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold italic">
                      Không tìm thấy người dùng phù hợp với bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Hiển thị 1 - {filteredUsers.length} trong tổng số {users.length} người dùng</span>
            <div className="flex gap-1">
              <button className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-40" disabled>
                <ChevronLeft size={16} />
              </button>
              <button className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-40" disabled>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Row Grid: Hiệu suất hệ thống (7 Cols) & Trạng thái AI (5 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Card Hiệu suất hệ thống */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Activity size={18} className="text-blue-600" />
                  Hiệu suất hệ thống
                </h2>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  Tần suất Requests / ngày & Độ trễ phản hồi trung bình
                </p>
              </div>

              {/* Nút lọc thời gian */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
                <button
                  onClick={() => setPerfTimeframe("24h")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${perfTimeframe === "24h" ? "bg-white text-blue-600 shadow-2xs" : "hover:text-slate-900"}`}
                >
                  24 giờ
                </button>
                <button
                  onClick={() => setPerfTimeframe("7d")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${perfTimeframe === "7d" ? "bg-white text-blue-600 shadow-2xs" : "hover:text-slate-900"}`}
                >
                  7 ngày
                </button>
                <button
                  onClick={() => setPerfTimeframe("30d")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${perfTimeframe === "30d" ? "bg-white text-blue-600 shadow-2xs" : "hover:text-slate-900"}`}
                >
                  30 ngày
                </button>
              </div>
            </div>

            <div className="h-[220px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={PERFORMANCE_HOURLY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}
                  />
                  <Area type="monotone" dataKey="requests" name="Requests / giờ" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#perfGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card Trạng thái AI (Sửa tiêu đề đúng chuẩn) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Zap size={18} className="text-indigo-600" />
                  Trạng thái AI
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase">
                  Ready
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Chỉ số sẵn sàng và hiệu năng các dịch vụ AI
              </p>
            </div>

            <div className="divide-y divide-slate-100 text-xs font-bold space-y-0.5">
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700">
                  <Server size={15} className="text-slate-400" />
                  <span>AI Engine</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[11px]">
                  Online
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700">
                  <Workflow size={15} className="text-slate-400" />
                  <span>RAG Pipeline</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[11px]">
                  Healthy
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700">
                  <Database size={15} className="text-slate-400" />
                  <span>Vector Database</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[11px]">
                  Healthy
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock size={15} className="text-slate-400" />
                  <span>Average Response</span>
                </div>
                <span className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                  1.2s
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 size={15} className="text-slate-400" />
                  <span>Accuracy (Độ chính xác RAG)</span>
                </div>
                <span className="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  98.4%
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Section 4: Hoạt động hệ thống gần đây */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <Layers3 size={18} className="text-blue-600" />
                Hoạt động hệ thống gần đây
              </h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Nhật ký tương tác người dùng, tải file, truy vấn RAG và khởi tạo workspace
              </p>
            </div>

            <button
              onClick={() => router.push("/activity-logs")}
              className="text-xs font-extrabold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all"
            >
              Xem tất cả nhật ký &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {recentActivities.map((act, idx) => (
              <div key={act._id || idx} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-extrabold text-xs">
                    {act.user?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">
                      <span>{act.user || act.userId?.username || "Người dùng"}</span>
                      <span className="font-normal text-slate-400"> đã thực hiện </span>
                      <span className="font-extrabold text-blue-600">{act.action}</span>
                    </p>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                      Đối tượng: <span className="text-slate-600 font-bold">{act.target || act.targetType || "Tài liệu"}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    {act.time || (act.createdAt ? new Date(act.createdAt).toLocaleTimeString("vi-VN") : "Gần đây")}
                  </span>
                  <span className="inline-block mt-0.5 text-[10px] font-black px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 uppercase">
                    Success
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatsCard({ 
  icon, 
  label, 
  subLabel,
  value,
  bgColor
}: { 
  icon: React.ReactNode;
  label: string;
  subLabel: string;
  value: string | number;
  bgColor: string;
}) {
  return (
    <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col gap-3 shadow-2xs hover:shadow-xs transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-slate-400 tracking-wider">{label}</span>
        <div className={`p-2 rounded-xl ${bgColor}`}>
          {icon}
        </div>
      </div>
      <div>
        <div className="text-2xl font-black text-slate-800 tracking-tight">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        <p className="text-[11px] font-semibold text-slate-400 mt-1">
          {subLabel}
        </p>
      </div>
    </div>
  );
}

