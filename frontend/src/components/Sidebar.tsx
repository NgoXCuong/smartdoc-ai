"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  ShieldAlert,
  LogOut,
  BrainCircuit,
  Settings,
  Folder,
  TrendingUp,
  Users,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authApi } from "@/services/api";
import { motion } from "framer-motion";
import { useNotifications } from "@/context/NotificationContext";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const { totalUnreadMessages } = useNotifications();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      router.push("/auth");
    }
  };

  if (!user) return null;

  return (
    <aside className="w-[260px] border-r border-slate-200 bg-white flex flex-col h-screen shrink-0 relative z-30">
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <BrainCircuit size={20} />
          </div>
          <span className="font-bold text-lg text-slate-800 tracking-tight">SmartDoc AI</span>
        </div>
        <p className="text-[11px] text-slate-500 font-medium ml-11">AI Knowledge Workspace</p>
      </div>

      <div className="px-5 my-4">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('trigger-upload'))}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl py-3 flex items-center justify-center gap-2 font-bold text-sm shadow-md shadow-blue-600/20 transition-all"
        >
          <span className="text-lg leading-none mb-0.5">+</span> Tải tài liệu
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-2">
        <NavItem
          href="/"
          icon={<LayoutDashboard size={18} />}
          label="Dashboard"
          active={pathname === "/"}
        />
        <NavItem
          href="/documents"
          icon={<FileText size={18} />}
          label="Tài liệu"
          active={pathname.startsWith("/documents")}
        />
        <NavItem
          href="/chat"
          icon={<MessageSquare size={18} />}
          label="Trợ lý AI"
          active={pathname.startsWith("/chat")}
          badge="RAG"
        />
        <NavItem
          href="/folders"
          icon={<Folder size={18} />}
          label="Dự án & Thư mục"
          active={pathname.startsWith("/folders")}
        />
        <NavItem
          href="/workspaces"
          icon={<Users size={18} />}
          label="Nhóm làm việc"
          active={pathname.startsWith("/workspaces")}
          badge={totalUnreadMessages || undefined}
        />
        <NavItem
          href="/settings"
          icon={<Settings size={18} />}
          label="Cài đặt"
          active={pathname.startsWith("/settings")}
        />
        <NavItem
          href="/activity-logs"
          icon={<History size={18} />}
          label="Nhật ký hoạt động"
          active={pathname.startsWith("/activity-logs")}
        />

        <div className="pt-3 mt-3 border-t border-slate-100 px-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Hệ thống & Kỹ thuật</p>
          <NavItem
            href="/admin/analytics"
            icon={<TrendingUp size={18} />}
            label="Giám sát AI"
            active={pathname.startsWith("/admin/analytics")}
            badge="RAG Metrics"
          />
          {user.role === "admin" && (
            <NavItem
              href="/admin"
              icon={<ShieldAlert size={18} />}
              label="Quản trị Hệ thống"
              active={pathname === "/admin"}
            />
          )}
        </div>
      </nav>

      {/* AI System Status Indicator */}
      <div className="mx-4 mb-2 p-3 bg-emerald-50/80 border border-emerald-200/60 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-bold text-emerald-800">AI Core Engine</span>
        </div>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200/60 text-emerald-800 uppercase tracking-wide">Online</span>
      </div>

      <div className="p-4 pt-2">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm overflow-hidden">
            {user.username?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-slate-800 truncate leading-tight mb-0.5">{user.username}</p>
            <p className="text-[11px] font-semibold text-indigo-600 truncate">Pro Workspace Plan</p>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg opacity-0 group-hover:opacity-100 bg-white shadow-sm border border-slate-200" title="Đăng xuất">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  icon,
  label,
  active,
  href,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  href: string;
  badge?: number | string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200",
        active
          ? "bg-slate-100 text-blue-600"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <span className={cn("transition-colors", active ? "text-blue-600" : "text-slate-400")}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>

      {/* Badge */}
      {badge != null && (
        <motion.span
          key={String(badge)}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm shadow-indigo-200"
        >
          {typeof badge === "number" ? (badge > 99 ? "99+" : badge) : badge}
        </motion.span>
      )}
    </Link>
  );
}

