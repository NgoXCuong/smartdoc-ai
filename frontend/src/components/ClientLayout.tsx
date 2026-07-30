"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { NotificationProvider } from "@/context/NotificationContext";
import { documentApi } from "@/services/api";
import { toast } from "react-hot-toast";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const [uploading, setUploading] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleTriggerUpload = (e: any) => {
      if (e?.detail?.folderId) {
        setTargetFolderId(e.detail.folderId);
      } else {
        setTargetFolderId(null);
      }
      document.getElementById("global-upload-input")?.click();
    };
    window.addEventListener("trigger-upload", handleTriggerUpload as EventListener);
    return () => window.removeEventListener("trigger-upload", handleTriggerUpload as EventListener);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File quá lớn. Vui lòng chọn file dưới 20MB.");
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Đang tải tài liệu lên...");

    // Resolve workspace ID from current path or localStorage cache
    let workspaceId = null;
    const matchWorkspace = pathname.match(/^\/workspaces\/([^/]+)/);
    if (matchWorkspace && matchWorkspace[1]) {
      workspaceId = matchWorkspace[1];
    } else {
      workspaceId = localStorage.getItem("activeWorkspaceId") || null;
    }

    // Resolve folder ID from current path or targetFolderId state
    let folderId = targetFolderId;
    if (!folderId) {
      const matchFolder = pathname.match(/^\/folders\/([^/]+)/);
      if (matchFolder && matchFolder[1]) {
        folderId = matchFolder[1];
      }
    }

    try {
      await documentApi.upload(file, workspaceId, folderId);
      toast.success("Tải lên thành công! Hệ thống đang xử lý...", { id: toastId });
      window.dispatchEvent(new CustomEvent("document-uploaded"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi tải lên", { id: toastId });
    } finally {
      setUploading(false);
      setTargetFolderId(null);
      if (e.target) e.target.value = ""; // Reset input
    }
  };

  // Tránh render nội dung phía Server để các extension không chèn thuộc tính vào
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  const isAuthPage = pathname === "/auth";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <NotificationProvider>
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col relative overflow-y-auto bg-background">
          {children}
        </div>
      </div>
      <input
        type="file"
        id="global-upload-input"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.md,image/*"
        onChange={handleFileUpload}
        disabled={uploading}
      />
    </NotificationProvider>
  );
}

