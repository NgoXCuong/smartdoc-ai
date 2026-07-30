import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Search, 
  Bell, 
  HelpCircle, 
  User, 
  ChevronDown, 
  Building2, 
  MessageSquare, 
  CheckCheck, 
  FileText, 
  Share2, 
  Users, 
  AlertCircle, 
  Trash2, 
  History, 
  X, 
  Loader2, 
  Settings, 
  LogOut, 
  ShieldAlert, 
  BookOpen, 
  Keyboard, 
  Mail, 
  Sparkles, 
  ExternalLink, 
  Folder 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/context/NotificationContext';
import { authApi, documentApi, workspaceApi, folderApi } from '@/services/api';
import { toast } from 'react-hot-toast';

interface HeaderProps {
  workspaces?: any[];
  currentWorkspaceId?: string | null;
  setCurrentWorkspaceId?: (id: string | null) => void;
  onSearchChange?: (query: string) => void;
}

export default function Header({ 
  workspaces: propsWorkspaces, 
  currentWorkspaceId: propsCurrentWorkspaceId, 
  setCurrentWorkspaceId: propsSetCurrentWorkspaceId,
  onSearchChange
}: HeaderProps) {
  // Local states
  const [internalWorkspaces, setInternalWorkspaces] = useState<any[]>([]);
  const [internalCurrentWorkspaceId, setInternalCurrentWorkspaceId] = useState<string | null>(null);
  
  const workspaces = propsWorkspaces || internalWorkspaces;
  const currentWorkspaceId = propsCurrentWorkspaceId !== undefined ? propsCurrentWorkspaceId : internalCurrentWorkspaceId;
  const setCurrentWorkspaceId = propsSetCurrentWorkspaceId || setInternalCurrentWorkspaceId;

  // Dropdown states
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeNotifTab, setActiveNotifTab] = useState<'system' | 'messages'>('system');
  const [activeHelpTab, setActiveHelpTab] = useState<'guide' | 'shortcuts' | 'support'>('guide');

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ docs: any[]; folders: any[]; workspaces: any[] }>({
    docs: [],
    folders: [],
    workspaces: []
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // User state
  const [user, setUser] = useState<any>(null);

  // Refs
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);
  const bellDropdownRef = useRef<HTMLDivElement>(null);
  const helpDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  const {
    notifications,
    unreadCount,
    totalUnreadMessages,
    unreadByWorkspace,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    markWorkspaceAsRead
  } = useNotifications();

  // Total unread badge
  const totalBadge = unreadCount + totalUnreadMessages;

  // Load User & Workspaces if not passed as props
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      authApi.getMe()
        .then(res => {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        })
        .catch(() => {});
    }

    if (!propsWorkspaces) {
      workspaceApi.getAll()
        .then(res => setInternalWorkspaces(res.data.workspaces || []))
        .catch(() => {});
    }
  }, [propsWorkspaces]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(event.target as Node)) {
        setIsWorkspaceOpen(false);
      }
      if (bellDropdownRef.current && !bellDropdownRef.current.contains(event.target as Node)) {
        setIsBellOpen(false);
      }
      if (helpDropdownRef.current && !helpDropdownRef.current.contains(event.target as Node)) {
        setIsHelpOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hotkey listener: Ctrl+K or Cmd+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsHelpOpen(false);
        setIsUserMenuOpen(false);
        setIsWorkspaceOpen(false);
        setIsBellOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search logic
  useEffect(() => {
    const query = searchQuery.trim();

    if (onSearchChange) {
      onSearchChange(searchQuery);
    }

    if (!query) {
      setSearchResults({ docs: [], folders: [], workspaces: [] });
      setIsSearchOpen(false);
      return;
    }

    setIsSearchOpen(true);
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const [docRes, folderRes] = await Promise.all([
          documentApi.getAll(1, 6, query),
          folderApi.getAll().catch(() => ({ data: { folders: [] } }))
        ]);

        const matchingDocs = docRes.data.documents || [];
        const matchingFolders = (folderRes.data.folders || []).filter((f: any) => 
          f.name?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 4);

        const matchingWorkspaces = workspaces.filter((ws: any) =>
          ws.name?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 3);

        setSearchResults({
          docs: matchingDocs,
          folders: matchingFolders,
          workspaces: matchingWorkspaces
        });
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, workspaces, onSearchChange]);

  const currentWorkspace = workspaces.find(ws => ws._id === currentWorkspaceId);

  const workspacesWithUnread = workspaces
    .filter(ws => (unreadByWorkspace[ws._id] || 0) > 0)
    .sort((a, b) => (unreadByWorkspace[b._id] || 0) - (unreadByWorkspace[a._id] || 0));

  const handleGoToChat = (workspaceId: string) => {
    markWorkspaceAsRead(workspaceId);
    setIsBellOpen(false);
    router.push(`/workspaces/${workspaceId}/chat`);
  };

  const handleNotificationClick = (item: any) => {
    if (!item.isRead) {
      markAsRead(item._id);
    }
    if (item.link) {
      setIsBellOpen(false);
      router.push(item.link);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      toast.success('Đã đăng xuất tài khoản');
      router.push('/auth');
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'DOC_SHARED':
        return <Share2 size={16} className="text-blue-500" />;
      case 'INVITE_WORKSPACE':
        return <Users size={16} className="text-purple-500" />;
      case 'PROCESS_COMPLETED':
        return <FileText size={16} className="text-emerald-500" />;
      default:
        return <AlertCircle size={16} className="text-amber-500" />;
    }
  };

  return (
    <header className="h-[72px] border-b border-slate-200/60 flex items-center justify-between px-8 bg-white sticky top-0 z-20">
      
      {/* ── SEARCH BAR ────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center gap-6" ref={searchRef}>
        <div className="relative w-full max-w-[420px]">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-full border border-transparent focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-md transition-all">
            <Search size={18} className="text-slate-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim()) setIsSearchOpen(true);
              }}
              placeholder="Tìm kiếm tài liệu, dự án, nhóm... (Ctrl+K)"
              className="bg-transparent border-none outline-none text-[13px] w-full text-slate-700 placeholder:text-slate-400 font-medium"
            />
            {isSearching ? (
              <Loader2 size={16} className="animate-spin text-blue-500 shrink-0" />
            ) : searchQuery ? (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full"
              >
                <X size={16} />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-200/60 rounded border border-slate-300/50">
                ⌘K
              </kbd>
            )}
          </div>

          {/* Search Results Popover Dropdown */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 max-h-[460px] overflow-y-auto"
              >
                {isSearching ? (
                  <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-blue-600" size={24} />
                    <p className="text-xs font-semibold">Đang tìm kiếm dữ liệu...</p>
                  </div>
                ) : (searchResults.docs.length === 0 && searchResults.folders.length === 0 && searchResults.workspaces.length === 0) ? (
                  <div className="p-8 text-center text-slate-400">
                    <Search size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">Không tìm thấy kết quả</p>
                    <p className="text-xs text-slate-400 mt-1">Thử từ khóa khác như tên file, thư mục hoặc không gian làm việc.</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-4">
                    {/* Matching Documents */}
                    {searchResults.docs.length > 0 && (
                      <div>
                        <div className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><FileText size={13} className="text-blue-500" /> Tài liệu ({searchResults.docs.length})</span>
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {searchResults.docs.map((doc: any) => (
                            <button
                              key={doc._id}
                              onClick={() => {
                                setIsSearchOpen(false);
                                router.push(`/chat?docId=${doc._id}`);
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50/60 transition-colors flex items-center justify-between group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">
                                  {doc.originalName?.slice(-3).toUpperCase() || 'DOC'}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-600">
                                    {doc.originalName}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {doc.status === 'completed' ? 'Đã xử lý AI' : 'Đang xử lý'} • {(doc.fileSize / 1024).toFixed(0)} KB
                                  </p>
                                </div>
                              </div>
                              <span className="text-[11px] text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                Hỏi AI →
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Folders */}
                    {searchResults.folders.length > 0 && (
                      <div className="border-t border-slate-100 pt-3">
                        <div className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Folder size={13} className="text-amber-500" /> Dự án / Thư mục
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {searchResults.folders.map((folder: any) => (
                            <button
                              key={folder._id}
                              onClick={() => {
                                setIsSearchOpen(false);
                                router.push(`/folders/${folder._id}`);
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-50/60 transition-colors flex items-center gap-3 group"
                            >
                              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                <Folder size={14} />
                              </div>
                              <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-amber-700">
                                {folder.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Workspaces */}
                    {searchResults.workspaces.length > 0 && (
                      <div className="border-t border-slate-100 pt-3">
                        <div className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Building2 size={13} className="text-purple-500" /> Nhóm làm việc
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {searchResults.workspaces.map((ws: any) => (
                            <button
                              key={ws._id}
                              onClick={() => {
                                setCurrentWorkspaceId(ws._id);
                                setIsSearchOpen(false);
                                router.push(`/workspaces/${ws._id}/chat`);
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl hover:bg-purple-50/60 transition-colors flex items-center gap-3 group"
                            >
                              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold text-xs">
                                {ws.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-purple-700">
                                {ws.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* ── RIGHT ACTION BAR ────────────────────────────────────────── */}
      <div className="flex items-center gap-5">
        
        {/* Workspace Selector Dropdown */}
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
          
          {/* Activity Logs Button */}
          <button
            onClick={() => router.push('/activity-logs')}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all"
            title="Nhật ký hoạt động"
          >
            <History size={20} />
          </button>

          {/* ── Bell Notification Icon ───────────────────────────────────── */}
          <div className="relative" ref={bellDropdownRef}>
            <button
              onClick={() => setIsBellOpen(!isBellOpen)}
              className="relative text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-xl hover:bg-slate-50"
              title="Thông báo"
            >
              <Bell size={20} />

              {totalBadge > 0 && (
                <AnimatePresence>
                  <motion.span
                    key={totalBadge}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="absolute top-0 right-0 min-w-[18px] h-4.5 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-md ring-2 ring-white"
                  >
                    {totalBadge > 99 ? '99+' : totalBadge}
                  </motion.span>
                </AnimatePresence>
              )}
            </button>

            {/* Notification Dropdown Popover */}
            <AnimatePresence>
              {isBellOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-3 right-0 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                >
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                    <span className="text-base font-bold text-slate-800">Thông báo</span>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && activeNotifTab === 'system' && (
                        <button
                          onClick={markAllAsRead}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-semibold"
                        >
                          <CheckCheck size={14} /> Đọc tất cả
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex border-b border-slate-100 px-5 pt-2 gap-4">
                    <button
                      onClick={() => setActiveNotifTab('system')}
                      className={`pb-2.5 text-xs font-bold transition-all relative ${
                        activeNotifTab === 'system' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Hệ thống {unreadCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-extrabold">{unreadCount}</span>}
                      {activeNotifTab === 'system' && (
                        <motion.div layoutId="notifTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                      )}
                    </button>

                    <button
                      onClick={() => setActiveNotifTab('messages')}
                      className={`pb-2.5 text-xs font-bold transition-all relative ${
                        activeNotifTab === 'messages' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Tin nhắn {totalUnreadMessages > 0 && <span className="ml-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-extrabold">{totalUnreadMessages}</span>}
                      {activeNotifTab === 'messages' && (
                        <motion.div layoutId="notifTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                      )}
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {activeNotifTab === 'system' ? (
                      notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
                            <Bell size={22} />
                          </div>
                          <p className="text-sm font-bold text-slate-800">Không có thông báo mới</p>
                          <p className="text-xs text-slate-400 mt-1">Thông báo hệ thống sẽ hiển thị tại đây.</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-4 transition-colors cursor-pointer hover:bg-slate-50 relative group flex gap-3.5 items-start ${
                              !n.isRead ? 'bg-blue-50/40' : ''
                            }`}
                          >
                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                              {getNotifIcon(n.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <p className={`text-xs font-bold line-clamp-1 ${!n.isRead ? 'text-blue-900' : 'text-slate-800'}`}>
                                  {n.title}
                                </p>
                                <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">
                                  {new Date(n.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                                {n.message}
                              </p>
                            </div>

                            {!n.isRead && (
                              <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2"></div>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(n._id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition-all absolute right-2 bottom-2"
                              title="Xóa thông báo"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))
                      )
                    ) : (
                      workspacesWithUnread.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center mb-3">
                            <MessageSquare size={22} />
                          </div>
                          <p className="text-sm font-bold text-slate-800">Không có tin nhắn chưa đọc</p>
                          <p className="text-xs text-slate-400 mt-1">Tất cả tin nhắn group chat đã được xem hết.</p>
                        </div>
                      ) : (
                        workspacesWithUnread.map((ws) => {
                          const count = unreadByWorkspace[ws._id] || 0;
                          return (
                            <button
                              key={ws._id}
                              onClick={() => handleGoToChat(ws._id)}
                              className="w-full flex items-center gap-3.5 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
                            >
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md">
                                {ws.name.charAt(0).toUpperCase()}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">
                                  {ws.name}
                                </p>
                                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <MessageSquare size={12} />
                                  {count} tin nhắn mới
                                </p>
                              </div>

                              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                {count > 99 ? '99+' : count}
                              </span>
                            </button>
                          );
                        })
                      )
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── HELP ICON (?) ───────────────────────────────────────────── */}
          <div className="relative" ref={helpDropdownRef}>
            <button
              onClick={() => setIsHelpOpen(!isHelpOpen)}
              className="text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-xl hover:bg-slate-50"
              title="Hướng dẫn & Trợ giúp"
            >
              <HelpCircle size={20} />
            </button>

            {/* Help Popover Dropdown */}
            <AnimatePresence>
              {isHelpOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-3 right-0 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                >
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Trung tâm trợ giúp</h4>
                        <p className="text-[11px] text-slate-400">SmartDoc AI Assistant</p>
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-slate-100 px-5 pt-2 gap-4">
                    <button
                      onClick={() => setActiveHelpTab('guide')}
                      className={`pb-2.5 text-xs font-bold transition-all relative ${
                        activeHelpTab === 'guide' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Hướng dẫn
                    </button>
                    <button
                      onClick={() => setActiveHelpTab('shortcuts')}
                      className={`pb-2.5 text-xs font-bold transition-all relative ${
                        activeHelpTab === 'shortcuts' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Phím tắt
                    </button>
                    <button
                      onClick={() => setActiveHelpTab('support')}
                      className={`pb-2.5 text-xs font-bold transition-all relative ${
                        activeHelpTab === 'support' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Hỗ trợ
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="p-5 max-h-80 overflow-y-auto">
                    {activeHelpTab === 'guide' && (
                      <div className="space-y-3.5 text-xs">
                        <div className="flex gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[11px] shrink-0">1</div>
                          <div>
                            <p className="font-bold text-slate-800">Tải lên tài liệu</p>
                            <p className="text-slate-500 mt-0.5">Bấm nút "+ Tạo tài liệu mới" ở thanh bên trái để tải các file PDF, DOCX, TXT.</p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[11px] shrink-0">2</div>
                          <div>
                            <p className="font-bold text-slate-800">Hỏi đáp AI (RAG Chat)</p>
                            <p className="text-slate-500 mt-0.5">Vào phần Trợ lý AI, chọn các tài liệu cần phân tích và đặt câu hỏi cho AI.</p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-[11px] shrink-0">3</div>
                          <div>
                            <p className="font-bold text-slate-800">Làm việc nhóm</p>
                            <p className="text-slate-500 mt-0.5">Tạo Workspace trong Nhóm làm việc, chia sẻ mã mời cho đồng nghiệp.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeHelpTab === 'shortcuts' && (
                      <div className="space-y-2.5 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                          <span className="text-slate-700 font-medium">Tìm kiếm nhanh</span>
                          <kbd className="px-2 py-1 bg-white border border-slate-200 rounded font-mono font-bold text-[10px] text-slate-600">Ctrl + K</kbd>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                          <span className="text-slate-700 font-medium">Đóng cửa sổ popup</span>
                          <kbd className="px-2 py-1 bg-white border border-slate-200 rounded font-mono font-bold text-[10px] text-slate-600">ESC</kbd>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                          <span className="text-slate-700 font-medium">Gửi tin nhắn chat</span>
                          <kbd className="px-2 py-1 bg-white border border-slate-200 rounded font-mono font-bold text-[10px] text-slate-600">ENTER</kbd>
                        </div>
                      </div>
                    )}

                    {activeHelpTab === 'support' && (
                      <div className="space-y-3 text-xs">
                        <div className="p-3 rounded-2xl bg-blue-50 text-blue-900 space-y-1">
                          <p className="font-bold flex items-center gap-1.5"><Mail size={14} /> Email hỗ trợ kỹ thuật</p>
                          <p className="text-[11px] text-blue-700">support@smartdoc.ai</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 text-slate-700 space-y-1">
                          <p className="font-bold flex items-center gap-1.5"><BookOpen size={14} /> Tài liệu phát triển API</p>
                          <p className="text-[11px] text-slate-500">Xem hệ thống tài liệu swagger và hướng dẫn kết nối.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── USER PROFILE ICON & DROPDOWN MENU ───────────────────────── */}
          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center hover:opacity-90 transition-all border border-blue-200 shadow-sm overflow-hidden"
              title={user?.username || 'Tài khoản'}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.username?.charAt(0).toUpperCase() || <User size={16} />
              )}
            </button>

            {/* User Profile Popover Dropdown */}
            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-3 right-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 py-1"
                >
                  {/* User Profile Header */}
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        user?.username?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">{user?.username || 'Người dùng'}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user?.email || 'user@example.com'}</p>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider">
                        {user?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                      </span>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        router.push('/settings');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center gap-2.5"
                    >
                      <Settings size={15} className="text-slate-400" /> Cài đặt tài khoản
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        router.push('/workspaces');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors flex items-center gap-2.5"
                    >
                      <Users size={15} className="text-slate-400" /> Nhóm làm việc
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        router.push('/activity-logs');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors flex items-center gap-2.5"
                    >
                      <History size={15} className="text-slate-400" /> Nhật ký hoạt động
                    </button>

                    {user?.role === 'admin' && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          router.push('/admin');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition-colors flex items-center gap-2.5"
                      >
                        <ShieldAlert size={15} className="text-amber-500" /> Hệ thống Quản trị
                      </button>
                    )}
                  </div>

                  {/* Logout Button */}
                  <div className="p-1.5 border-t border-slate-100">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2.5"
                    >
                      <LogOut size={15} className="text-rose-500" /> Đăng xuất
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </header>
  );
}
