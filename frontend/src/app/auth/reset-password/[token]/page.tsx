"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { authApi } from "@/services/api";
import { Logo } from "@/components/Logo";
import { toast, Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import { Lock, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Đang cập nhật mật khẩu...");

    try {
      await authApi.resetPassword(token, {
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });
      toast.success("Đặt lại mật khẩu thành công!", { id: toastId });
      setSuccess(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Token không hợp lệ hoặc đã hết hạn.", { id: toastId });
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

        <div className="bg-white border border-border p-8 rounded-3xl shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Đặt lại mật khẩu</h1>
            <p className="text-muted-foreground text-sm">
              Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
            </p>
          </div>

          {success ? (
            <div className="text-center">
              <div className="bg-success/10 border border-success/20 p-4 rounded-xl mb-6">
                <p className="text-success font-medium">Mật khẩu của bạn đã được cập nhật!</p>
              </div>
              <Link 
                href="/auth"
                className="inline-flex bg-primary text-primary-foreground py-3 px-6 rounded-xl font-bold items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md shadow-primary/20"
              >
                Đăng nhập ngay
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium px-1">Mật khẩu mới</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-muted-foreground" size={18} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-border rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-primary focus:bg-white transition-colors"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium px-1">Xác nhận mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-muted-foreground" size={18} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-border rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-primary focus:bg-white transition-colors"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !formData.password || !formData.confirmPassword}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 mt-4 shadow-lg shadow-primary/20"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>Đổi mật khẩu <ArrowRight size={18} /></>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
