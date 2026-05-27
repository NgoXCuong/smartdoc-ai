"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Database,
  Trash2,
  ShieldAlert,
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight,
  HelpCircle
} from "lucide-react";
import { adminApi } from "@/services/api";
import { toast } from "react-hot-toast";
import {
  AreaChart,
  Area,
  ResponsiveContainer
} from "recharts";

// Dữ liệu mô phỏng cho biểu đồ Hiệu suất hệ thống
const mockPerformanceData = [
  { value: 20 }, { value: 35 }, { value: 25 }, { value: 60 }, { value: 45 }, { value: 30 },
  { value: 15 }, { value: 25 }, { value: 10 }, { value: 40 }, { value: 55 }, { value: 35 },
  { value: 20 }, { value: 10 }, { value: 25 }, { value: 45 }, { value: 25 }, { value: 15 }
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/auth");
      return;
    }
    
    const user = JSON.parse(userStr);
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
    } catch (error: any) {
      toast.error("Lỗi khi tải dữ liệu Admin: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa người dùng ${username}? Hành động này sẽ xóa toàn bộ dữ liệu của họ.`)) return;

    const toastId = toast.loading("Đang xóa người dùng...");
    try {
      await adminApi.deleteUser(userId);
      toast.success("Đã xóa người dùng thành công", { id: toastId });
      setUsers(users.filter(u => u._id !== userId));
      // Refresh stats
      const statsRes = await adminApi.getStats();
      setStats(statsRes.data.stats);
    } catch (error: any) {
      toast.error("Lỗi khi xóa người dùng: " + (error.response?.data?.message || error.message), { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 h-full">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center text-red-500 shadow-inner">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Bảng điều khiển Admin</h1>
            <p className="text-sm text-slate-500 mt-1">Quản lý người dùng, phân quyền và giám sát toàn diện hệ thống tài liệu AI thông minh.</p>
          </div>
        </div>

        {/* 4 Thẻ Thống Kê */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            icon={<Users size={24} className="text-blue-600" />} 
            label="TỔNG NGƯỜI DÙNG" 
            value={stats?.totalUsers || 0} 
          />
          <StatsCard 
            icon={<FileText size={24} className="text-blue-600" />} 
            label="TỔNG TÀI LIỆU" 
            value={stats?.totalDocs || 0} 
          />
          <StatsCard 
            icon={<MessageSquare size={24} className="text-blue-600" />} 
            label="PHIÊN CHAT" 
            value={stats?.totalChats || 0} 
          />
          <StatsCard 
            icon={<Database size={24} className="text-blue-600" />} 
            label="LƯU TRỮ" 
            value={stats?.totalStorageBytes ? `${(stats.totalStorageBytes / 1024 / 1024).toFixed(2)} MB` : '0 MB'} 
          />
        </div>

        {/* Danh sách người dùng */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* Header Bảng */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Danh sách người dùng</h2>
              <p className="text-sm text-slate-500 mt-1">Danh sách tài khoản được đăng ký trong tổ chức của bạn</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full border border-blue-100">
                {users.length} Người dùng
              </span>
              <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                <Filter size={20} />
              </button>
            </div>
          </div>
          
          {/* Bảng */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-5">Tên & Email</th>
                  <th className="p-5">Vai trò</th>
                  <th className="p-5">Ngày tham gia</th>
                  <th className="p-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u, index) => {
                  const isAdmin = u.role === 'admin';
                  // Tạo màu ngẫu nhiên nhưng ổn định cho Avatar dựa vào index
                  const avatarColors = [
                    'bg-blue-100 text-blue-600', 
                    'bg-slate-100 text-slate-600', 
                    'bg-blue-100 text-blue-600',
                    'bg-indigo-100 text-indigo-600',
                    'bg-emerald-100 text-emerald-600'
                  ];
                  const colorClass = avatarColors[index % avatarColors.length];

                  return (
                    <tr key={u._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm ${colorClass}`}>
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{u.username}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={`px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${
                          isAdmin 
                            ? 'bg-red-50 text-red-600 border-red-200' 
                            : 'bg-blue-50 text-blue-600 border-blue-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-5 text-sm text-slate-500 font-medium">
                        {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="p-5 text-right">
                        {u.role !== 'admin' && (
                          <button 
                            onClick={() => handleDeleteUser(u._id, u.username)}
                            className="p-2 text-slate-400 hover:bg-slate-100 hover:text-red-500 rounded-lg transition-colors inline-flex"
                            title="Xóa người dùng"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 italic">
                      Không tìm thấy người dùng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination giả lập */}
          <div className="p-5 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
            <span>Đang hiển thị 1-{Math.min(users.length, 3)} trong tổng số {users.length} người dùng</span>
            <div className="flex gap-2">
              <button className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-50" disabled>
                <ChevronLeft size={18} />
              </button>
              <button className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-50" disabled>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Row Dưới cùng */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Hiệu Suất Hệ Thống */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-64">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Hiệu suất hệ thống</h3>
              <span className="text-xs font-bold text-blue-600">Hoạt động tốt</span>
            </div>
            <div className="flex-1 w-full relative overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockPerformanceData}>
                  <defs>
                    <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1} 
                    fill="url(#colorPerf)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card Trình Trạng AI */}
          <div className="lg:col-span-1 bg-blue-700 rounded-2xl p-6 shadow-md flex flex-col justify-between text-white relative overflow-hidden">
            <h3 className="font-bold text-sm uppercase tracking-wider opacity-90 mb-6 relative z-10">Trình trạng AI</h3>
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between border-b border-blue-600/50 pb-3">
                <span className="text-sm font-medium opacity-90">Độ trễ phản hồi</span>
                <span className="font-bold">~1.2s</span>
              </div>
              <div className="flex items-center justify-between border-b border-blue-600/50 pb-3">
                <span className="text-sm font-medium opacity-90">Tỷ lệ chính xác</span>
                <span className="font-bold">98.4%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium opacity-90">Số yêu cầu/Phút</span>
                <span className="font-bold">142</span>
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-600 rounded-full blur-xl opacity-50 z-0"></div>
            
            <button className="absolute bottom-5 right-5 bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors shadow-lg z-10">
              <HelpCircle size={18} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatsCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shadow-inner border border-blue-100/50">
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <div className="text-3xl font-bold text-slate-800 flex items-baseline gap-1">
          {typeof value === 'string' && value.includes('MB') ? (
            <>
              <span>{value.split(' ')[0]}</span>
              <span className="text-sm font-bold text-slate-500 uppercase">MB</span>
            </>
          ) : (
            value
          )}
        </div>
      </div>
    </div>
  );
}
