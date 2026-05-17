"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  MessageSquare,
  ShieldAlert,
  LogOut,
  BrainCircuit,
  Settings,
  Folder,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authApi } from "@/services/api";
import { motion } from "framer-motion";


export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

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
    <aside className="w-64 border-r border-border bg-white flex flex-col h-screen shrink-0 relative">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
          <BrainCircuit size={24} />
        </div>
        <span className="font-bold text-xl tracking-tight text-foreground">SmartDoc AI</span>
      </div>

      <nav className="flex-1 py-6 space-y-1">
        <div className="px-6 mb-3">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Main Menu</span>
        </div>
        <NavItem
          href="/"
          icon={<FileText size={20} />}
          label="Tài liệu"
          active={pathname === "/"}
        />
        <NavItem
          href="/chat"
          icon={<MessageSquare size={20} />}
          label="Trợ lý AI"
          active={pathname.startsWith("/chat")}
        />
        <NavItem
          href="/folders"
          icon={<Folder size={20} />}
          label="Dự án"
          active={pathname.startsWith("/folders")}
        />

        <div className="pt-8 pb-3 px-6">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Cá nhân</span>
        </div>
        <NavItem
          href="/settings"
          icon={<Settings size={20} />}
          label="Cài đặt"
          active={pathname.startsWith("/settings")}
        />

        {user.role === "admin" && (
          <>
            <div className="pt-8 pb-3 px-6">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Admin Panel</span>
            </div>
            <NavItem
              href="/admin"
              icon={<ShieldAlert size={20} />}
              label="Hệ thống"
              active={pathname === "/admin"}
            />
            <NavItem
              href="/admin/analytics"
              icon={<TrendingUp size={20} />}
              label="Giám sát"
              active={pathname === "/admin/analytics"}
            />
          </>
        )}
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-border/50">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-inner">
            {user.username?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-foreground truncate">{user.username}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
          </div>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors p-1" title="Đăng xuất">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active, href }: { icon: React.ReactNode, label: string, active?: boolean, href: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all duration-200 relative group",
        active
          ? "text-primary font-bold"
          : "text-muted-foreground hover:text-foreground hover:bg-slate-50"
      )}
    >
      {active && (
        <motion.div
          layoutId="active-bar"
          className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
        />
      )}
      <span className={cn("transition-transform duration-200", active ? "scale-110" : "group-hover:translate-x-1")}>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}
