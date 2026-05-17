"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tránh render nội dung phía Server để các extension không chèn thuộc tính vào
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  const isAuthPage = pathname === "/auth";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col relative overflow-hidden bg-background">
        {children}
      </div>
    </div>
  );
}
