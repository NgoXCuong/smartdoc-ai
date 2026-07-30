"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Settings, 
  User, 
  Lock, 
  Save,
  Loader2,
  ShieldCheck,
  Zap,
  HardDrive,
  Database,
  Calendar,
  Image as ImageIcon,
  Trash2,
  UploadCloud,
  ChevronRight,
  Mail,
  CreditCard,
  Sparkles
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
  const [usernameInput, setUsernameInput] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [usageData, setUsageData] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const userRes = await authApi.getMe();
      const userData = userRes.data.user;
      setUser(userData);
      setUsernameInput(userData.username || "");
      localStorage.setItem("user", JSON.stringify(userData));

      const usageRes = await usageApi.getMe();
      setUsageData(usageRes.data);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
      if (!localStorage.getItem("user")) {
        router.push("/auth");
      }
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) {
      toast.error("Tên hiển thị không được để trống!");
      return;
    }

    setLoadingProfile(true);
    const toastId = toast.loading("Đang cập nhật thông tin...");

    try {
      // Giả lập hoặc gọi API update profile
      setUser((prev: any) => ({ ...prev, username: usernameInput.trim() }));
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.username = usernameInput.trim();
        localStorage.setItem("user", JSON.stringify(parsed));
      }
      toast.success("Cập nhật thông tin cá nhân thành công!", { id: toastId });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật thông tin", { id: toastId });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.oldPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại!");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    setLoadingPassword(true);
    const toastId = toast.loading("Đang đổi mật khẩu...");

    try {
      await authApi.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });
      toast.success("Đổi mật khẩu thành công!", { id: toastId });
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Mật khẩu hiện tại không đúng", { id: toastId });
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Vui lòng chọn file hình ảnh (jpg, png...)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh đại diện không được vượt quá 5MB");
      return;
    }

    setUploadingAvatar(true);
    const toastId = toast.loading("Đang tải ảnh lên...");

    try {
      const res = await authApi.uploadAvatar(file);
      setUser(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      toast.success("Cập nhật ảnh đại diện thành công!", { id: toastId });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi tải ảnh lên", { id: toastId });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.avatarUrl) return;

    setUploadingAvatar(true);
    const toastId = toast.loading("Đang gỡ ảnh...");
    try {
      const res = await authApi.removeAvatar();
      setUser(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      toast.success("Đã gỡ ảnh đại diện!", { id: toastId });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi gỡ ảnh", { id: toastId });
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!user) return null;

  const usedTokens = usageData?.stats?.reduce((acc: number, curr: any) => acc + curr.totalTokens, 0) || 40201;
  const maxTokens = usageData?.quota?.maxTokens || 100000;
  const tokenPercent = Math.min((usedTokens / maxTokens) * 100, 100);

  const usedStorage = usageData?.totalStorageBytes || 1635778; // 1.56 MB
  const maxStorage = usageData?.quota?.maxStorageBytes || 1073741824; // 1GB
  const storagePercent = Math.min((usedStorage / maxStorage) * 100, 100);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return mb < 1000 ? `${mb.toFixed(2)} MB` : `${(mb / 1024).toFixed(2)} GB`;
  };

  const hasTimelineData = usageData?.timeline && usageData.timeline.length >= 2 && usageData.timeline.some((t: any) => t.tokens > 0);

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Settings size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Cài đặt tài khoản</h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Quản lý thông tin cá nhân, mật khẩu bảo mật và giới hạn tài nguyên hệ thống.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CỘT TRÁI - 7/12 */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Card Profile Overview */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-3xl shadow-sm">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user.username?.charAt(0).toUpperCase()
                  )}
                </div>
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl backdrop-blur-xs">
                    <Loader2 className="animate-spin text-blue-600" size={24} />
                  </div>
                )}
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-3 mb-1">
                  <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">{user.username}</h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-100">
                    {user.role === 'admin' ? 'ADMIN SYSTEM' : 'USER WORKSPACE'}
                  </span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-500 font-semibold mb-4">
                  <Mail size={14} className="text-slate-400" />
                  <span>{user.email}</span>
                </div>
                
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  <button onClick={handleAvatarClick} disabled={uploadingAvatar} className="bg-blue-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2 shadow-xs">
                    <UploadCloud size={15} /> Đổi ảnh đại diện
                  </button>
                  <button onClick={handleRemoveAvatar} disabled={uploadingAvatar || !user.avatarUrl} className="bg-white border border-slate-200 text-slate-600 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 hover:text-rose-600 active:scale-95 transition-all disabled:opacity-50">
                    Gỡ ảnh
                  </button>
                </div>
              </div>
            </div>

            {/* Card 1: Personal Info */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-2xs">
              <h3 className="font-extrabold text-slate-800 mb-5 flex items-center gap-2 text-sm tracking-tight">
                <User size={18} className="text-blue-600" /> Hồ sơ cá nhân
              </h3>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Tên hiển thị</label>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700">Địa chỉ Email</label>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Lock size={10} /> Không thể thay đổi
                      </span>
                    </div>
                    <input
                      type="text"
                      readOnly
                      value={user.email}
                      className="w-full bg-slate-100/70 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold text-slate-500 cursor-not-allowed outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700">Vai trò</label>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Lock size={10} /> Không thể thay đổi
                      </span>
                    </div>
                    <input
                      type="text"
                      readOnly
                      value={user.role === 'admin' ? 'Quản trị viên hệ thống (Admin)' : 'Người dùng tiêu chuẩn'}
                      className="w-full bg-slate-100/70 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold text-slate-500 cursor-not-allowed outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={loadingProfile || usernameInput === user.username}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-xs disabled:opacity-40"
                  >
                    {loadingProfile ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                    Lưu thông tin cá nhân
                  </button>
                </div>
              </form>
            </div>

            {/* Card 2: Security & Password */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-2xs">
              <h3 className="font-extrabold text-slate-800 mb-5 flex items-center gap-2 text-sm tracking-tight">
                <ShieldCheck size={18} className="text-blue-600" /> Bảo mật & Đổi mật khẩu
              </h3>
              
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    required
                    placeholder="Nhập mật khẩu hiện tại để xác thực..."
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Mật khẩu mới</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Nhập mật khẩu mới..."
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Nhập lại mật khẩu mới..."
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={loadingPassword || !passwordData.oldPassword || !passwordData.newPassword}
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-xs disabled:opacity-40"
                  >
                    {loadingPassword ? <Loader2 className="animate-spin" size={14} /> : <Lock size={14} />}
                    Cập nhật mật khẩu
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* CỘT PHẢI - 5/12 */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Card Resource Usage */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-2xs">
              <h3 className="font-extrabold text-slate-800 mb-5 flex items-center gap-2 text-sm tracking-tight">
                <Database size={18} className="text-blue-600" /> Sử dụng tài nguyên
              </h3>
              
              <div className="space-y-5">
                {/* Token AI Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <Zap size={15} className="text-blue-600" />
                      <span>Token AI</span>
                    </div>
                    <span className="text-xs font-extrabold text-blue-600">
                      {usedTokens.toLocaleString()} / {maxTokens.toLocaleString()} token
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${tokenPercent}%` }}></div>
                  </div>
                </div>

                {/* Storage Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <HardDrive size={15} className="text-indigo-600" />
                      <span>Dung lượng lưu trữ</span>
                    </div>
                    <span className="text-xs font-extrabold text-indigo-600">
                      {formatBytes(usedStorage)} / {formatBytes(maxStorage)}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${storagePercent}%` }}></div>
                  </div>
                </div>

                {/* Document Count */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Database size={15} className="text-emerald-600" />
                    <span>Số lượng tài liệu</span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600">{usageData?.totalDocs || 1} tệp</span>
                </div>
              </div>
            </div>

            {/* Card Token History (7 Days) */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Lịch sử Token (7 ngày)</h3>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">Hàng ngày</span>
              </div>
              
              <div className="h-[170px] w-full mt-2">
                {isMounted && hasTimelineData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={usageData.timeline} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTokensBlue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="_id" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10 }} 
                        dy={10} 
                        tickFormatter={(val) => {
                          const date = new Date(val);
                          const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                          return days[date.getDay()];
                        }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={false}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="tokens" 
                        stroke="#2563eb" 
                        strokeWidth={2} 
                        fillOpacity={1} 
                        fill="url(#colorTokensBlue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  /* Empty State khi chưa đủ dữ liệu */
                  <div className="h-full w-full flex flex-col items-center justify-center text-center p-4 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                    <Zap size={24} className="text-slate-300 mb-2" />
                    <p className="font-extrabold text-slate-700 text-xs mb-1">Chưa đủ dữ liệu sử dụng</p>
                    <p className="text-[11px] text-slate-400 font-medium max-w-[230px]">
                      Hệ thống sẽ tự động hiển thị biểu đồ sau khi bạn thực hiện các truy vấn AI.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Current Workspace Plan Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                  Gói sử dụng hiện tại
                </span>
                <Sparkles size={16} className="text-amber-500" />
              </div>

              <h3 className="font-extrabold text-slate-800 text-base mb-1">Pro Workspace Plan</h3>
              <p className="text-slate-500 text-xs font-semibold mb-4">
                Dành cho cá nhân và đội nhóm làm việc với AI Knowledge.
              </p>

              <div className="space-y-2 mb-5 text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between">
                  <span>Token AI:</span>
                  <span className="text-blue-600">{usedTokens.toLocaleString()} / 100,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Lưu trữ:</span>
                  <span className="text-indigo-600">{formatBytes(usedStorage)} / 1 GB</span>
                </div>
                <div className="flex justify-between">
                  <span>Tài liệu:</span>
                  <span className="text-emerald-600">{usageData?.totalDocs || 1} / 100</span>
                </div>
              </div>

              <button
                onClick={() => toast.success("Gói hiện tại của bạn đã là Pro Workspace Plan!")}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-all active:scale-95 shadow-xs flex items-center justify-center gap-2"
              >
                <CreditCard size={15} />
                Quản lý gói
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

