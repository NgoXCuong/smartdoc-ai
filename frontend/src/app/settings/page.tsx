"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Settings, 
  User, 
  Lock, 
  Mail, 
  Save,
  Loader2,
  ShieldCheck,
  Zap,
  HardDrive,
  Database,
  Calendar
} from "lucide-react";
import { authApi, usageApi } from "@/services/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { toast } from "react-hot-toast";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [usageData, setUsageData] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/auth");
    } else {
      setUser(JSON.parse(userStr));
      fetchUsage();
    }
  }, [router]);

  const fetchUsage = async () => {
    try {
      const res = await usageApi.getMe();
      setUsageData(res.data);
    } catch (error) {
      console.error("Lỗi khi tải thông tin sử dụng:", error);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Đang cập nhật mật khẩu...");

    try {
      await authApi.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });
      toast.success("Đổi mật khẩu thành công!", { id: toastId });
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Đã có lỗi xảy ra", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 h-full">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Settings size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cài đặt tài khoản</h1>
            <p className="text-muted-foreground">Quản lý thông tin cá nhân và bảo mật.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Cột thông tin cá nhân */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white border border-border p-6 rounded-2xl shadow-sm text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-4xl mx-auto mb-4 shadow-inner">
                {user.username?.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-foreground">{user.username}</h2>
              <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-bold uppercase tracking-wider">
                <ShieldCheck size={14} />
                {user.role}
              </div>
            </div>

            <div className="bg-white border border-border p-6 rounded-2xl shadow-sm">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <User size={18} className="text-primary"/> Thông tin
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Tên hiển thị</p>
                  <p className="font-medium">{user.username}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email đăng nhập</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ngày tham gia</p>
                  <p className="font-medium">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
            </div>

            {usageData && (
              <div className="bg-white border border-border p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Database size={18} className="text-primary"/> Tài nguyên đã dùng
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap size={16} className="text-amber-500" />
                    <span className="text-muted-foreground">Token AI</span>
                  </div>
                  <span className="font-bold text-slate-800">
                    {usageData.stats?.reduce((acc: number, curr: any) => acc + curr.totalTokens, 0).toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <HardDrive size={16} className="text-blue-500" />
                    <span className="text-muted-foreground">Lưu trữ</span>
                  </div>
                  <span className="font-bold text-slate-800">
                    {(usageData.totalStorageBytes / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Save size={16} className="text-green-500" />
                    <span className="text-muted-foreground">Tài liệu</span>
                  </div>
                  <span className="font-bold text-slate-800">{usageData.totalDocs} file</span>
                </div>
              </div>
            )}
          </div>

          {/* Cột bảo mật */}
          <div className="md:col-span-2">
            <div className="bg-white border border-border p-6 rounded-2xl shadow-sm">
              <h3 className="font-bold text-foreground mb-6 flex items-center gap-2 text-xl">
                <Lock size={22} className="text-primary"/> Đổi mật khẩu
              </h3>
              
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 text-foreground">Mật khẩu hiện tại</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-muted-foreground" size={18} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-border rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-primary focus:bg-white transition-colors"
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 text-foreground">Mật khẩu mới</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-muted-foreground" size={18} />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-border rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-primary focus:bg-white transition-colors"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 text-foreground">Xác nhận mật khẩu mới</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-muted-foreground" size={18} />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-border rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-primary focus:bg-white transition-colors"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || !passwordData.oldPassword || !passwordData.newPassword}
                    className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>

            {usageData && (
              <div className="mt-8 bg-white border border-border p-6 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-foreground flex items-center gap-2 text-xl">
                    <Zap size={22} className="text-amber-500"/> Lịch sử Token (7 ngày)
                  </h3>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-medium text-slate-600">
                    <Calendar className="w-3.5 h-3.5" />
                    Thống kê sử dụng AI
                  </div>
                </div>
                
                <div className="h-[280px] w-full mt-4">
                  {isMounted && usageData.timeline?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={usageData.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="_id" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 12 }} 
                          dy={10} 
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 12 }} 
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="tokens" 
                          stroke="#f59e0b" 
                          strokeWidth={3} 
                          fillOpacity={1} 
                          fill="url(#colorTokens)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-400 italic">
                      Chưa có dữ liệu tiêu thụ trong 7 ngày qua.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
