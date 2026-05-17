"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { authApi } from "@/services/api";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (token) {
      verifyEmail();
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      await authApi.verifyEmail(token);
      setStatus("success");
      // Nếu có lưu thông tin user chưa active, thì cập nhật lại
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        user.isEmailVerified = true;
        localStorage.setItem("user", JSON.stringify(user));
      }
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error.response?.data?.message || "Token không hợp lệ hoặc đã hết hạn.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <div className="bg-white border border-border p-8 rounded-3xl shadow-xl text-center">
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="animate-spin text-primary mb-4" size={48} />
              <h2 className="text-xl font-bold">Đang xác thực email...</h2>
              <p className="text-muted-foreground mt-2">Vui lòng chờ trong giây lát.</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center text-success mb-6">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Xác thực thành công!</h2>
              <p className="text-muted-foreground mb-8">
                Tài khoản của bạn đã được xác thực email. Bây giờ bạn có thể trải nghiệm toàn bộ tính năng của hệ thống.
              </p>
              <Link
                href="/"
                className="bg-primary text-primary-foreground py-3 px-8 rounded-xl font-bold hover:opacity-90 transition-all shadow-md shadow-primary/20"
              >
                Vào Dashboard ngay
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mb-6">
                <XCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Xác thực thất bại</h2>
              <p className="text-muted-foreground mb-8">
                {errorMessage}
              </p>
              <Link
                href="/auth"
                className="bg-muted text-foreground py-3 px-8 rounded-xl font-bold hover:bg-muted/80 transition-all"
              >
                Quay lại đăng nhập
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
