"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface ChatHeaderProps {
  selectedDocCount: number;
}

export default function ChatHeader({ selectedDocCount }: ChatHeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-white/50 backdrop-blur-md flex items-center px-6 shrink-0 z-10">
      <Link href="/" className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm font-medium transition-colors mr-4">
        <ChevronLeft size={16} /> Dashboard
      </Link>
      <div className="flex-1 text-center">
        <h2 className="font-bold text-foreground">Trợ lý SmartDoc AI</h2>
        <p className="text-xs text-muted-foreground">Đang hỏi trên {selectedDocCount} tài liệu</p>
      </div>
      <div className="w-20" /> {/* Spacer for centering */}
    </header>
  );
}
