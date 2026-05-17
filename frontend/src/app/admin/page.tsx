"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Database, 
  MessageSquare, 
  HardDrive,
  Trash2,
  ShieldAlert,
  Loader2
} from "lucide-react";
import { adminApi } from "@/services/api";
import { toast } from "react-hot-toast";

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
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 h-full">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Control Panel</h1>
            <p className="text-muted-foreground">Quản lý người dùng và giám sát hệ thống SmartDoc AI.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatsCard icon={<Users className="text-blue-500" />} label="Tổng Người Dùng" value={stats?.totalUsers || 0} />
          <StatsCard icon={<Database className="text-purple-500" />} label="Tổng Tài Liệu" value={stats?.totalDocs || 0} />
          <StatsCard icon={<MessageSquare className="text-green-500" />} label="Phiên Chat" value={stats?.totalChats || 0} />
          <StatsCard 
            icon={<HardDrive className="text-orange-500" />} 
            label="Dung Lượng Lưu Trữ" 
            value={`${((stats?.totalStorageBytes || 0) / 1024 / 1024).toFixed(2)} MB`} 
          />
        </div>

        {/* Users Table */}
        <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-foreground">Danh Sách Người Dùng</h2>
            <span className="text-sm font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
              {users.length} Users
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 text-muted-foreground text-sm border-b border-border">
                  <th className="p-4 font-semibold uppercase tracking-wider">Tên & Email</th>
                  <th className="p-4 font-semibold uppercase tracking-wider">Vai trò</th>
                  <th className="p-4 font-semibold uppercase tracking-wider">Ngày tham gia</th>
                  <th className="p-4 font-semibold uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/80 to-accent flex items-center justify-center text-white font-bold shadow-inner">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{u.username}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-4 text-right">
                      {u.role !== 'admin' && (
                        <button 
                          onClick={() => handleDeleteUser(u._id, u.username)}
                          className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                          title="Xóa người dùng"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      Không tìm thấy người dùng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="bg-white border border-border p-6 rounded-2xl flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-border/50 flex items-center justify-center text-2xl shadow-inner">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-muted-foreground mb-1">{label}</p>
        <p className="text-3xl font-black text-foreground">{value}</p>
      </div>
    </div>
  );
}
