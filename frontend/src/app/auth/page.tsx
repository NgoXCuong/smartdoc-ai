"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/services/api";
import { Logo } from "@/components/Logo";
import { toast, Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const res = await authApi.login({
          email: formData.email,
          password: formData.password,
        });
        toast.success("Đăng nhập thành công!");
        
        // Lưu cả user và token
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("accessToken", res.data.accessToken);
        
        router.push("/");
      } else {
        await authApi.register(formData);
        toast.success("Đăng ký thành công! Hãy đăng nhập.");
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Toaster position="top-center" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <div className="bg-muted/30 border border-border p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">
              {isLogin ? "Chào mừng trở lại" : "Tạo tài khoản mới"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isLogin
                ? "Đăng nhập để tiếp tục phân tích tài liệu của bạn"
                : "Bắt đầu trải nghiệm SmartDoc AI ngay hôm nay"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium px-1">Tên người dùng</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-muted-foreground" size={18} />
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-primary transition-colors"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium px-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-muted-foreground" size={18} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-primary transition-colors"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium px-1">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-muted-foreground" size={18} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-primary transition-colors"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              {isLogin && (
                <div className="text-right">
                  <Link href="/auth/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                    Quên mật khẩu?
                  </Link>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 mt-4 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isLogin ? "Đăng nhập" : "Đăng ký"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-muted-foreground">
              {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
            </span>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-primary font-bold hover:underline"
            >
              {isLogin ? "Đăng ký ngay" : "Đăng nhập ngay"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
