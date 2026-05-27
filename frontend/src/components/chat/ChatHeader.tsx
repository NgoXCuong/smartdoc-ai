"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, Bell, HelpCircle } from "lucide-react";

interface ChatHeaderProps {
  selectedDocCount: number;
}

export default function ChatHeader({ selectedDocCount }: ChatHeaderProps) {
  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
      <div className="flex flex-col">
        <Link href="/" className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-bold transition-colors">
          <ChevronLeft size={16} /> SmartDoc AI Assistant
          <div className="w-2 h-2 bg-emerald-500 rounded-full ml-1"></div>
        </Link>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-5 mt-0.5">
          {selectedDocCount === 0 
            ? "WAITING FOR REFERENCE DOCUMENTS" 
            : `QUERYING ${selectedDocCount} REFERENCE DOCUMENTS`}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button className="bg-slate-100 hover:bg-slate-200 text-blue-600 font-bold text-xs px-4 py-2 rounded-full transition-colors shadow-sm">
          Upgrade to Plus
        </button>
        <div className="flex items-center gap-3 text-slate-400">
          <button className="hover:text-slate-600 transition-colors">
            <Bell size={20} />
          </button>
          <button className="hover:text-slate-600 transition-colors">
            <HelpCircle size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
