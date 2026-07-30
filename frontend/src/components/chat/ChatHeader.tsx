"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface ChatHeaderProps {
  selectedDocCount: number;
}

export default function ChatHeader({ selectedDocCount }: ChatHeaderProps) {
  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
      <div className="flex flex-col">
        <Link href="/" className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-bold transition-colors">
          <ChevronLeft size={16} /> SmartDoc AI Assistant
          <div className="w-2 h-2 bg-emerald-500 rounded-full ml-1" title="Trực tuyến"></div>
        </Link>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-5 mt-0.5">
          {selectedDocCount === 0 
            ? "ĐANG CHỜ CHỌN TÀI LIỆU THAM KHẢO" 
            : `ĐANG TRUY VẤN ${selectedDocCount} TÀI LIỆU THAM KHẢO`}
        </p>
      </div>
    </header>
  );
}
