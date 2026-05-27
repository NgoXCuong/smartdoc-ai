"use client";

import React, { useState } from "react";
import { MessageSquarePlus, FileText, Eye, Pin, Edit3, Trash2, Folder, ChevronDown, ChevronRight, Building, User, Settings, History } from "lucide-react";
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
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<any>(null);

  // Hàm tính dung lượng giả lập hoặc format thật
  const formatSize = (bytes?: number) => {
    if (!bytes) return "1.2 MB"; // Mock data if no size
    const mb = bytes / (1024 * 1024);
    return mb < 1000 ? `${mb.toFixed(1)} MB` : `${(mb / 1024).toFixed(1)} GB`;
  };

  // Tính thời gian thêm giả lập
  const getAddedTime = (date?: string) => {
    if (!date) return "Added 2h ago";
    return "Added recently"; // Đơn giản hóa UI
  };

  return (
    <div className="w-[320px] border-r border-slate-200 bg-[#F9FAFB] flex flex-col shrink-0 h-full">

      {/* Workspace Switcher */}
      {setCurrentWorkspaceId && (
        <div className="p-5 border-b border-slate-200 bg-white relative">
          <button
            onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
            className="w-full flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-sm hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <User size={20} />
              </div>
              <div className="text-left">
                <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Workspace</div>
                <div className="text-sm font-bold text-slate-800 line-clamp-1">
                  {currentWorkspaceId ? workspaces.find(w => w._id === currentWorkspaceId)?.name : "Personal Space"}
                </div>
              </div>
            </div>
            <ChevronDown size={18} className="text-slate-400" />
          </button>

          {showWorkspaceMenu && (
            <div className="absolute top-full left-5 right-5 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
              <button
                onClick={() => { setCurrentWorkspaceId(null); setShowWorkspaceMenu(false); }}
                className={cn("w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors", !currentWorkspaceId && "bg-blue-50")}
              >
                <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600 shrink-0"><User size={16} /></div>
                <div className="flex-1 text-sm font-medium text-slate-800">Personal Space</div>
              </button>

              {workspaces.length > 0 && <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-y border-slate-100">Your Organizations</div>}

              {workspaces.map(ws => (
                <div
                  key={ws._id}
                  onClick={() => { setCurrentWorkspaceId(ws._id); setShowWorkspaceMenu(false); }}
                  className={cn("w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors group cursor-pointer", currentWorkspaceId === ws._id && "bg-blue-50")}
                >
                  <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0"><Building size={16} /></div>
                  <div className="flex-1 text-sm font-medium text-slate-800 line-clamp-1">{ws.name}</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingWorkspace(ws); setShowWorkspaceModal(true); setShowWorkspaceMenu(false); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 rounded transition-all"
                  >
                    <Settings size={14} />
                  </button>
                </div>
              ))}

              <div className="p-2 border-t border-slate-100 mt-1">
                <button
                  onClick={() => { setEditingWorkspace(null); setShowWorkspaceModal(true); setShowWorkspaceMenu(false); }}
                  className="w-full py-2 text-xs text-blue-600 font-bold hover:bg-blue-50 rounded-lg transition-colors"
                >
                  + Create Workspace
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

      <div className="flex-1 overflow-y-auto p-5 space-y-8 scroll-smooth">
        {/* Document Selection */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reference Docs</h3>
            <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2.5 py-0.5 rounded-full">
              {selectedDocIds.length} Active
            </span>
          </div>
          
          <div className="space-y-3">
            {documents.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No documents available.</p>
            ) : (
              documents.map(doc => {
                const isActive = selectedDocIds.includes(doc._id);
                // Giả lập icon PDF / Docx
                const isPdf = doc.fileName?.toLowerCase().endsWith('.pdf');
                
                return (
                  <div
                    key={doc._id}
                    className={cn(
                      "w-full flex items-center p-3 bg-white rounded-xl border transition-all relative group cursor-pointer shadow-sm hover:shadow-md",
                      isActive 
                        ? "border-blue-300 ring-1 ring-blue-100" 
                        : "border-slate-200 hover:border-blue-200"
                    )}
                    onClick={() => toggleDocument(doc._id)}
                  >
                    {/* Icon File */}
                    <div className="mr-3 shrink-0">
                      {isPdf ? (
                        <div className="w-8 h-8 flex items-center justify-center text-red-500 font-bold border border-red-200 rounded text-[10px] bg-red-50">
                          PDF
                        </div>
                      ) : (
                        <div className="w-8 h-8 flex items-center justify-center text-blue-500 font-bold border border-blue-200 rounded text-[10px] bg-blue-50">
                          DOC
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-sm font-bold text-slate-800 truncate">{doc.fileName}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {getAddedTime(doc.createdAt)} • {formatSize(doc.fileSize)}
                      </p>
                    </div>

                    {/* Active Status Dot */}
                    {isActive && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    )}

                    {/* Preview Button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewDoc(doc); }}
                      className={cn(
                        "absolute right-8 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-opacity",
                        isActive ? "opacity-0 group-hover:opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}
                      title="Preview"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recent Conversations</h3>
            <History size={14} className="text-slate-400" />
          </div>
          <div className="space-y-1">
            {sessions.map(session => (
              <div
                key={session._id}
                className={cn(
                  "group flex items-center gap-1 px-3 py-2.5 rounded-xl transition-all cursor-pointer",
                  currentSessionId === session._id
                    ? "bg-blue-50"
                    : "hover:bg-slate-100"
                )}
              >
                {editingSessionId === session._id ? (
                  <input
                    autoFocus
                    className="flex-1 bg-white border border-blue-300 rounded px-2 py-1 text-sm outline-none text-slate-800"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => handleRename(session._id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename(session._id)}
                  />
                ) : (
                  <div
                    onClick={() => loadSession(session._id)}
                    className="flex-1 text-left text-sm truncate flex items-center gap-2"
                  >
                    {session.isPinned && <Pin size={12} className="fill-blue-500 text-blue-500 shrink-0" />}
                    <span className={cn(
                      "truncate font-medium transition-colors",
                      currentSessionId === session._id ? "text-blue-900" : "text-slate-600 group-hover:text-slate-900"
                    )}>
                      {session.title || "New Conversation"}
                    </span>
                  </div>
                )}

                <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleTogglePin(session); }}
                    className={cn("p-1.5 rounded hover:bg-slate-200 transition-colors", session.isPinned ? "text-blue-500" : "text-slate-400")}
                  >
                    <Pin size={14} className={session.isPinned ? "fill-current" : ""} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSessionId(session._id);
                      setEditingTitle(session.title);
                    }}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-400 transition-colors"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteSession(session._id); }}
                    className="p-1.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"
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
