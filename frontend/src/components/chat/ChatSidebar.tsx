"use client";

import React, { useState } from "react";
import { MessageSquarePlus, FileText, Eye, Pin, Edit3, Trash2, Folder, ChevronDown, ChevronRight, Building, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import WorkspaceModal from "./WorkspaceModal";

interface ChatSidebarProps {
  createNewChat: () => void;
  documents: any[];
  folders?: any[];
  workspaces?: any[];
  currentWorkspaceId?: string | null;
  setCurrentWorkspaceId?: (id: string | null) => void;
  fetchInitialData?: (wsId?: string | null) => void;
  selectedDocIds: string[];
  toggleDocument: (id: string) => void;
  selectFolder?: (id: string) => void;
  setPreviewDoc: (doc: any) => void;
  sessions: any[];
  currentSessionId: string | null;
  loadSession: (id: string) => void;
  editingSessionId: string | null;
  editingTitle: string;
  setEditingTitle: (val: string) => void;
  handleRename: (id: string) => void;
  setEditingSessionId: (id: string | null) => void;
  handleTogglePin: (session: any) => void;
  handleDeleteSession: (id: string) => void;
}

export default function ChatSidebar({
  createNewChat,
  documents,
  selectedDocIds,
  toggleDocument,
  setPreviewDoc,
  sessions,
  currentSessionId,
  loadSession,
  editingSessionId,
  editingTitle,
  setEditingTitle,
  handleRename,
  setEditingSessionId,
  handleTogglePin,
  handleDeleteSession,
  folders = [],
  workspaces = [],
  currentWorkspaceId = null,
  setCurrentWorkspaceId,
  fetchInitialData,
  selectFolder,
}: ChatSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<any>(null);

  const toggleFolderExpand = (folderId: string) => {
    setExpandedFolders(prev =>
      prev.includes(folderId) ? prev.filter(id => id !== folderId) : [...prev, folderId]
    );
  };

  // Nhóm tài liệu theo thư mục
  const docsByFolder: Record<string, any[]> = {};
  const unassignedDocs: any[] = [];

  documents.forEach(doc => {
    if (doc.folderId) {
      if (!docsByFolder[doc.folderId]) docsByFolder[doc.folderId] = [];
      docsByFolder[doc.folderId].push(doc);
    } else {
      unassignedDocs.push(doc);
    }
  });

  return (
    <div className="w-80 border-r border-border bg-white flex flex-col shrink-0">

      {/* Workspace Switcher */}
      {setCurrentWorkspaceId && (
        <div className="p-4 border-b border-border bg-slate-50 relative">
          <button
            onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
            className="w-full flex items-center justify-between bg-white border border-border p-2.5 rounded-lg shadow-sm hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className={cn("w-8 h-8 rounded bg-primary/10 flex items-center justify-center", currentWorkspaceId ? "text-indigo-600" : "text-primary")}>
                {currentWorkspaceId ? <Building size={16} /> : <User size={16} />}
              </div>
              <div className="text-left">
                <div className="text-xs text-muted-foreground font-medium">Không gian làm việc</div>
                <div className="text-sm font-bold text-foreground line-clamp-1">
                  {currentWorkspaceId ? workspaces.find(w => w._id === currentWorkspaceId)?.name : "Cá nhân"}
                </div>
              </div>
            </div>
            <ChevronDown size={16} className="text-muted-foreground" />
          </button>

          {showWorkspaceMenu && (
            <div className="absolute top-full left-4 right-4 mt-2 bg-white border border-border rounded-lg shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
              <button
                onClick={() => { setCurrentWorkspaceId(null); setShowWorkspaceMenu(false); }}
                className={cn("w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors", !currentWorkspaceId && "bg-primary/5")}
              >
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0"><User size={16} /></div>
                <div className="flex-1 text-sm font-medium">Cá nhân</div>
              </button>

              {workspaces.length > 0 && <div className="px-3 py-1 text-xs font-semibold text-muted-foreground bg-slate-50 border-y border-border/50">TỔ CHỨC CỦA BẠN</div>}

              {workspaces.map(ws => (
                <div
                  key={ws._id}
                  onClick={() => { setCurrentWorkspaceId(ws._id); setShowWorkspaceMenu(false); }}
                  className={cn("w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors group cursor-pointer", currentWorkspaceId === ws._id && "bg-primary/5")}
                >
                  <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0"><Building size={16} /></div>
                  <div className="flex-1 text-sm font-medium line-clamp-1">{ws.name}</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingWorkspace(ws); setShowWorkspaceModal(true); setShowWorkspaceMenu(false); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-indigo-100 text-muted-foreground hover:text-indigo-600 rounded transition-all"
                  >
                    <Settings size={14} />
                  </button>
                </div>
              ))}

              <div className="p-2 border-t border-border mt-1">
                <button
                  onClick={() => { setEditingWorkspace(null); setShowWorkspaceModal(true); setShowWorkspaceMenu(false); }}
                  className="w-full py-1.5 text-xs text-primary font-medium hover:bg-primary/10 rounded transition-colors"
                >
                  + Tạo tổ chức mới
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showWorkspaceModal && (
        <WorkspaceModal
          workspace={editingWorkspace}
          onClose={() => setShowWorkspaceModal(false)}
          onSuccess={() => {
            setShowWorkspaceModal(false);
            if (fetchInitialData) fetchInitialData(currentWorkspaceId);
          }}
        />
      )}

      <div className="p-4 border-b border-border">
        <button
          onClick={createNewChat}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-sm"
        >
          <MessageSquarePlus size={18} />
          Hội thoại mới
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Document Selection */}
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Tài liệu tham chiếu</h3>
          <div className="space-y-2">
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Chưa có tài liệu nào sẵn sàng.</p>
            ) : (
              <div className="space-y-3">
                {/* Hiển thị theo thư mục */}
                {folders.map(folder => {
                  const folderDocs = docsByFolder[folder._id] || [];
                  if (folderDocs.length === 0) return null;
                  const isExpanded = expandedFolders.includes(folder._id);

                  return (
                    <div key={folder._id} className="space-y-1">
                      <div className="flex items-center justify-between group">
                        <button
                          onClick={() => toggleFolderExpand(folder._id)}
                          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors flex-1 text-left"
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          <Folder size={14} style={{ color: folder.color }} />
                          {folder.name} <span className="text-xs text-muted-foreground">({folderDocs.length})</span>
                        </button>
                        {selectFolder && (
                          <button
                            onClick={() => selectFolder(folder._id)}
                            className="text-[10px] uppercase font-bold text-primary opacity-0 group-hover:opacity-100 bg-primary/10 px-2 py-0.5 rounded transition-all"
                            title="Chat với tất cả tài liệu trong thư mục này"
                          >
                            Chọn tất cả
                          </button>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="pl-4 space-y-1 mt-1 border-l-2 border-slate-100 ml-1.5">
                          {folderDocs.map(doc => (
                            <div
                              key={doc._id}
                              className={cn(
                                "w-full flex items-center gap-2 p-2 rounded-lg border text-xs transition-all group relative",
                                selectedDocIds.includes(doc._id)
                                  ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                                  : "bg-white border-transparent hover:border-border"
                              )}
                            >
                              <button
                                onClick={() => toggleDocument(doc._id)}
                                className="flex-1 flex items-start gap-2 text-left"
                              >
                                <FileText size={14} className={selectedDocIds.includes(doc._id) ? "text-primary" : "text-muted-foreground"} />
                                <span className="line-clamp-1 font-medium leading-tight">{doc.fileName}</span>
                              </button>
                              <button
                                onClick={() => setPreviewDoc(doc)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-primary/10 rounded transition-all text-primary shrink-0"
                                title="Xem trước"
                              >
                                <Eye size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Tài liệu không nằm trong thư mục nào */}
                {unassignedDocs.length > 0 && (
                  <div className="space-y-1">
                    {folders.length > 0 && <div className="text-xs font-semibold text-muted-foreground mb-2 mt-4 px-1">Khác</div>}
                    {unassignedDocs.map(doc => (
                      <div
                        key={doc._id}
                        className={cn(
                          "w-full flex items-center gap-2 p-2 rounded-lg border text-xs transition-all group relative",
                          selectedDocIds.includes(doc._id)
                            ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                            : "bg-white border-border hover:border-primary/30"
                        )}
                      >
                        <button
                          onClick={() => toggleDocument(doc._id)}
                          className="flex-1 flex items-start gap-2 text-left"
                        >
                          <FileText size={14} className={selectedDocIds.includes(doc._id) ? "text-primary" : "text-muted-foreground"} />
                          <span className="line-clamp-2 font-medium leading-snug">{doc.fileName}</span>
                        </button>
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-primary/10 rounded transition-all text-primary shrink-0"
                          title="Xem trước"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chat History */}
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Lịch sử</h3>
          <div className="space-y-1">
            {sessions.map(session => (
              <div
                key={session._id}
                className={cn(
                  "group flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors relative",
                  currentSessionId === session._id
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {editingSessionId === session._id ? (
                  <input
                    autoFocus
                    className="flex-1 bg-white border border-primary/30 rounded px-2 py-1 text-sm outline-none"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => handleRename(session._id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename(session._id)}
                  />
                ) : (
                  <button
                    onClick={() => loadSession(session._id)}
                    className="flex-1 text-left text-sm truncate font-medium flex items-center gap-2"
                  >
                    {session.isPinned && <Pin size={12} className="fill-primary text-primary shrink-0" />}
                    <span className="truncate">{session.title || "Cuộc trò chuyện mới"}</span>
                  </button>
                )}

                <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => handleTogglePin(session)}
                    className={cn("p-1 rounded hover:bg-primary/10 transition-colors", session.isPinned ? "text-primary" : "text-muted-foreground")}
                  >
                    <Pin size={14} className={session.isPinned ? "fill-current" : ""} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingSessionId(session._id);
                      setEditingTitle(session.title);
                    }}
                    className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteSession(session._id)}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
