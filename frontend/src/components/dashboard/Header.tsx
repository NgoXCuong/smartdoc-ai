import React from 'react';
import { Search, Plus } from 'lucide-react';

interface HeaderProps {
  workspaces: any[];
  currentWorkspaceId: string | null;
  setCurrentWorkspaceId: (id: string | null) => void;
  uploading: boolean;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Header({ workspaces, currentWorkspaceId, setCurrentWorkspaceId, uploading, handleFileUpload }: HeaderProps) {
  return (
    <header className="h-20 border-b border-slate-200/60 flex items-center justify-between px-10 bg-white/80 backdrop-blur-xl sticky top-0 z-20 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)] gap-4 transition-all">
      <div className="flex items-center gap-4">
        <select
          value={currentWorkspaceId || ""}
          onChange={(e) => setCurrentWorkspaceId(e.target.value || null)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-semibold shadow-sm cursor-pointer transition-all hover:bg-slate-100/80"
        >
          <option value="">👤 Không gian Cá nhân</option>
          {workspaces.map(ws => (
            <option key={ws._id} value={ws._id}>🏢 {ws.name}</option>
          ))}
        </select>

        <div className="flex items-center gap-3 bg-slate-50 px-5 py-2.5 rounded-xl w-[360px] border border-slate-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all shadow-sm group hover:bg-white focus-within:bg-white">
          <Search size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu, nội dung..."
            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30">
        <Plus size={18} />
        <span className="text-sm">{uploading ? "Đang tải lên..." : "Thêm tài liệu"}</span>
        <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,.md,image/*" onChange={handleFileUpload} disabled={uploading} />
      </label>
    </header>
  );
}
