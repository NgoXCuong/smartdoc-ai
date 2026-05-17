"use client";

import React, { useState } from "react";
import { authApi } from "@/services/api";
import { Logo } from "@/components/Logo";
import { toast, Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    const toastId = toast.loading("Đang gửi yêu cầu...");

    try {
      await authApi.forgotPassword({ email });
      toast.success("Đã gửi email khôi phục!", { id: toastId });
      setSuccess(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể gửi email. Vui lòng kiểm tra lại.", { id: toastId });
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
          <Link href="/auth" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft size={16} /> Quay lại đăng nhập
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Quên mật khẩu?</h1>
            <p className="text-muted-foreground text-sm">
              Nhập email của bạn để nhận liên kết đặt lại mật khẩu.
            </p>
          </div>

          {success ? (
            <div className="bg-success/10 border border-success/20 p-4 rounded-xl text-center">
              <p className="text-success font-medium mb-2">Đã gửi email thành công!</p>
              <p className="text-sm text-success/80">
                Vui lòng kiểm tra hộp thư đến (và thư mục rác) của <strong>{email}</strong> để đặt lại mật khẩu.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium px-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-muted-foreground" size={18} />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    className="w-full bg-slate-50 border border-border rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-primary focus:bg-white transition-colors"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 mt-4 shadow-lg shadow-primary/20"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>Gửi liên kết khôi phục <ArrowRight size={18} /></>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
