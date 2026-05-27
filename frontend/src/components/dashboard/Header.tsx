import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, HelpCircle, User, ChevronDown, Building2, MessageSquare, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/context/NotificationContext';

interface HeaderProps {
  workspaces: any[];
  currentWorkspaceId: string | null;
  setCurrentWorkspaceId: (id: string | null) => void;
}

export default function Header({ workspaces, currentWorkspaceId, setCurrentWorkspaceId }: HeaderProps) {
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);
  const bellDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { totalUnread, unreadByWorkspace, markWorkspaceAsRead } = useNotifications();

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(event.target as Node)) {
        setIsWorkspaceOpen(false);
      }
      if (bellDropdownRef.current && !bellDropdownRef.current.contains(event.target as Node)) {
        setIsBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentWorkspace = workspaces.find(ws => ws._id === currentWorkspaceId);

  // Danh sách workspace có tin chưa đọc, sắp xếp theo số unread giảm dần
  const workspacesWithUnread = workspaces
    .filter(ws => (unreadByWorkspace[ws._id] || 0) > 0)
    .sort((a, b) => (unreadByWorkspace[b._id] || 0) - (unreadByWorkspace[a._id] || 0));

  const handleGoToChat = (workspaceId: string) => {
    markWorkspaceAsRead(workspaceId);
    setIsBellOpen(false);
    router.push(`/workspaces/${workspaceId}/chat`);
  };

  const handleMarkAllRead = () => {
    workspacesWithUnread.forEach(ws => markWorkspaceAsRead(ws._id));
    setIsBellOpen(false);
  };

  return (
    <header className="h-[72px] border-b border-slate-200/60 flex items-center justify-between px-8 bg-white sticky top-0 z-20">
      <div className="flex-1 flex items-center gap-6">
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-full w-[400px] border border-transparent focus-within:border-slate-300 focus-within:bg-white transition-all">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu, dự án..."
            className="bg-transparent border-none outline-none text-[13px] w-full text-slate-700 placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-5">
        {/* Workspace Selector */}
        <div className="relative" ref={workspaceDropdownRef}>
          <button 
            onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
            className="flex items-center gap-2 bg-transparent border-none text-slate-600 text-[13px] outline-none font-semibold cursor-pointer hover:text-slate-900 transition-colors"
          >
            <User size={14} className="text-slate-400" />
            <span>{currentWorkspace ? currentWorkspace.name : "Chọn không gian làm việc"}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          
          {isWorkspaceOpen && (
            <div className="absolute top-full mt-3 right-0 w-60 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 overflow-hidden">
              <button 
                onClick={() => { setCurrentWorkspaceId(null); setIsWorkspaceOpen(false); }}
                className={`w-full text-left px-4 py-3 text-[13px] font-medium flex items-center gap-3 hover:bg-slate-50 transition-colors ${!currentWorkspaceId ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}
              >
                <User size={16} /> Không gian Cá nhân
              </button>
              {workspaces.map(ws => (
                <button
                  key={ws._id}
                  onClick={() => { setCurrentWorkspaceId(ws._id); setIsWorkspaceOpen(false); }}
                  className={`w-full text-left px-4 py-3 text-[13px] font-medium flex items-center gap-3 hover:bg-slate-50 transition-colors border-t border-slate-50 ${currentWorkspaceId === ws._id ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}
                >
                  <Building2 size={16} /> {ws.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 ml-4 pl-4 border-l border-slate-200">
          {/* ── Bell Icon với Notification Badge & Dropdown ──────────────── */}
          <div className="relative" ref={bellDropdownRef}>
            <button
              onClick={() => setIsBellOpen(!isBellOpen)}
              className="relative text-slate-400 hover:text-slate-700 transition-colors"
              title="Thông báo"
            >
              <Bell size={20} />

              {/* Badge số unread */}
              <AnimatePresence>
                {totalUnread > 0 && (
                  <motion.span
                    key={totalUnread}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center leading-none shadow-sm"
                  >
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {isBellOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-3 right-0 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
                >
                  {/* Header dropdown */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <span className="text-sm font-bold text-slate-700">Thông báo</span>
                    {workspacesWithUnread.length > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-500 transition-colors font-medium"
                        title="Đánh dấu tất cả đã đọc"
                      >
                        <CheckCheck size={12} />
                        Đọc hết
                      </button>
                    )}
                  </div>

                  {/* Notification items */}
                  {workspacesWithUnread.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                        <Bell size={18} className="text-slate-300" />
                      </div>
                      <p className="text-sm font-semibold text-slate-500">Không có thông báo mới</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Tin nhắn group chat sẽ hiện ở đây</p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                      {workspacesWithUnread.map(ws => {
                        const count = unreadByWorkspace[ws._id] || 0;
                        return (
                          <button
                            key={ws._id}
                            onClick={() => handleGoToChat(ws._id)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50/50 transition-colors text-left"
                          >
                            {/* Workspace Avatar */}
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                              {ws.name.charAt(0).toUpperCase()}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold text-slate-800 truncate">
                                {ws.name}
                              </p>
                              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <MessageSquare size={10} />
                                {count} tin nhắn chưa đọc
                              </p>
                            </div>

                            {/* Unread count badge */}
                            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {count > 99 ? '99+' : count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="border-t border-slate-100 px-4 py-2.5">
                    <button
                      onClick={() => { setIsBellOpen(false); router.push('/workspaces'); }}
                      className="w-full text-center text-[12px] text-indigo-500 hover:text-indigo-700 font-semibold transition-colors"
                    >
                      Xem tất cả nhóm chat →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button className="text-slate-400 hover:text-slate-700 transition-colors">
            <HelpCircle size={20} />
          </button>
          <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors border border-slate-200">
            <User size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
