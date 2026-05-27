"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { chatApi, documentApi, folderApi, workspaceApi } from "@/services/api";
import { toast } from "react-hot-toast";
import { FileText, TrendingUp, AlertTriangle, Globe, Bot } from "lucide-react";

// Extracted Components
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageItem from "@/components/chat/MessageItem";
import ChatInput from "@/components/chat/ChatInput";
import DocumentPreview from "@/components/chat/DocumentPreview";

interface Message {
  _id?: string;
  role: "user" | "assistant";
  content: string;
  metadata?: any;
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDocId = searchParams.get("docId");

  const [documents, setDocuments] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(initialDocId ? [initialDocId] : []);
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Management states
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchInitialData(currentWorkspaceId);
  }, [currentWorkspaceId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const fetchInitialData = async (workspaceId: string | null = null) => {
    try {
      const [docsRes, sessionsRes, foldersRes, workspacesRes] = await Promise.all([
        documentApi.getAll(1, 50, "", "", workspaceId || ""),
        chatApi.getSessions().catch(() => ({ data: { sessions: [] } })),
        folderApi.getAll().catch(() => ({ data: { folders: [] } })),
        workspaceApi.getAll().catch(() => ({ data: { workspaces: [] } }))
      ]);

      const completedDocs = docsRes.data.documents.filter((d: any) => d.status === "completed");
      setDocuments(completedDocs);

      if (foldersRes.data?.folders) {
        setFolders(foldersRes.data.folders);
      }

      if (sessionsRes.data?.sessions) {
        setSessions(sessionsRes.data.sessions);
      }

      if (workspacesRes.data?.workspaces) {
        setWorkspaces(workspacesRes.data.workspaces);
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu ban đầu:", error);
    }
  };

  const loadSession = async (sessionId: string) => {
    setLoading(true);
    try {
      const res = await chatApi.getHistory(sessionId);
      setMessages(res.data.history || []);
      setCurrentSessionId(sessionId);
      const session = sessions.find(s => s._id === sessionId);
      if (session && session.docIds) {
        setSelectedDocIds(session.docIds);
      }
    } catch (error) {
      toast.error("Không thể tải lịch sử trò chuyện");
    } finally {
      setLoading(false);
    }
  };

  const createNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    if (!initialDocId) setSelectedDocIds([]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleDocument = (docId: string) => {
    setSelectedDocIds(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const selectFolder = (folderId: string) => {
    const docsInFolder = documents.filter(d => d.folderId === folderId).map(d => d._id);
    if (docsInFolder.length === 0) {
      toast.error("Thư mục này chưa có tài liệu nào sẵn sàng.");
      return;
    }
    setSelectedDocIds(docsInFolder);
    toast.success(`Đã chọn ${docsInFolder.length} tài liệu trong thư mục`);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || selectedDocIds.length === 0 || loading) {
      if (selectedDocIds.length === 0) toast.error("Vui lòng chọn ít nhất 1 tài liệu để hỏi.");
      return;
    }

    const question = input.trim();
    setInput("");
    setLoading(true);

    const userMessage: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);

    try {
      let fullContent = "";
      await chatApi.askStreaming(
        question,
        selectedDocIds,
        currentSessionId || null,
        (data: any) => {
          if (data.type === 'metadata') {
            setLoading(false);
            if (data.sessionId && !currentSessionId) setCurrentSessionId(data.sessionId);
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: "",
                metadata: {
                  sources: data.chunks.map((c: any, i: number) => ({
                    index: i + 1,
                    docId: c.metadata?.source || c.source,
                    fileName: c.metadata?.fileName || c.fileName,
                    pageNumber: c.metadata?.pageNumber || c.pageNumber,
                  }))
                }
              }
            ]);
          } else if (data.type === 'content') {
            fullContent += data.content;
            setMessages((prev) => {
              const newMsgs = [...prev];
              const lastMsg = newMsgs[newMsgs.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                lastMsg.content = fullContent;
              }
              return newMsgs;
            });
          }
        }
      );
      fetchInitialData(); // Làm mới lịch sử bên sidebar
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi gửi tin nhắn");
      setMessages((prev) => prev.slice(0, -1)); // Xóa tin nhắn trợ lý lỗi
    } finally {
      setLoading(false);
    }
  };

  const handleSourceClick = (docId: string, pageNumber: string | number, fileName?: string) => {
    let doc = null;

    // Nếu có docId, tìm theo docId trước
    if (docId && docId !== "UNKNOWN") {
      doc = documents.find(d => d._id === docId);
    }

    // Nếu không có docId (tin nhắn cũ) hoặc không tìm thấy bằng docId, thử tìm bằng fileName
    if (!doc && fileName) {
      doc = documents.find(d => d.fileName === fileName);
    }

    if (doc) {
      setPreviewDoc({ ...doc, startPage: pageNumber });
    } else {
      toast.error("Tài liệu không còn tồn tại hoặc chưa được đồng bộ.");
    }
  };

  const handleRename = async (sessionId: string) => {
    if (!editingTitle.trim()) return;
    try {
      await chatApi.updateSession(sessionId, { title: editingTitle });
      setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, title: editingTitle } : s));
      setEditingSessionId(null);
      toast.success("Đã đổi tên cuộc trò chuyện");
    } catch (error) {
      toast.error("Không thể đổi tên");
    }
  };

  const handleTogglePin = async (session: any) => {
    try {
      const newStatus = !session.isPinned;
      await chatApi.updateSession(session._id, { isPinned: newStatus });
      setSessions(prev => {
        const updated = prev.map(s => s._id === session._id ? { ...s, isPinned: newStatus } : s);
        return updated.sort((a, b) => {
          if (a.isPinned === b.isPinned) {
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          }
          return a.isPinned ? -1 : 1;
        });
      });
      toast.success(newStatus ? "Đã ghim cuộc trò chuyện" : "Đã bỏ ghim");
    } catch (error) {
      toast.error("Thao tác thất bại");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa cuộc trò chuyện này?")) return;
    try {
      await chatApi.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s._id !== sessionId));
      if (currentSessionId === sessionId) {
        createNewChat();
      }
      toast.success("Đã xóa cuộc trò chuyện");
    } catch (error) {
      toast.error("Không thể xóa");
    }
  };

  if (!isMounted) return null;

  return (
    <div className="flex h-full bg-slate-50">
      <ChatSidebar
        createNewChat={createNewChat}
        documents={documents}
        folders={folders}
        workspaces={workspaces}
        currentWorkspaceId={currentWorkspaceId}
        setCurrentWorkspaceId={setCurrentWorkspaceId}
        fetchInitialData={fetchInitialData}
        selectedDocIds={selectedDocIds}
        toggleDocument={toggleDocument}
        selectFolder={selectFolder}
        setPreviewDoc={setPreviewDoc}
        sessions={sessions}
        currentSessionId={currentSessionId}
        loadSession={loadSession}
        editingSessionId={editingSessionId}
        editingTitle={editingTitle}
        setEditingTitle={setEditingTitle}
        handleRename={handleRename}
        setEditingSessionId={setEditingSessionId}
        handleTogglePin={handleTogglePin}
        handleDeleteSession={handleDeleteSession}
      />

      <div className="flex-1 flex flex-col relative">
        <ChatHeader selectedDocCount={selectedDocIds.length} />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-6 pb-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center mt-10 md:mt-20">
                <div className="w-24 h-24 bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-3xl flex items-center justify-center mb-8">
                  <Bot size={48} className="text-blue-600" />
                </div>
                
                <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4 tracking-tight">How can I help you today?</h2>
                <p className="text-slate-500 max-w-xl text-center mb-12">
                  Ask questions about your uploaded documents, generate summaries, or extract specific data using the power of SmartDoc AI.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
                  {/* Card 1 */}
                  <button 
                    onClick={() => setInput("Summarize Documents")}
                    className="p-5 text-left border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all bg-white group"
                  >
                    <div className="flex items-center gap-2 mb-2 text-blue-600">
                      <FileText size={18} />
                      <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Summarize Documents</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">Get a concise high-level overview of all active reference files.</p>
                  </button>

                  {/* Card 2 */}
                  <button 
                    onClick={() => setInput("Extract Key Findings")}
                    className="p-5 text-left border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all bg-white group"
                  >
                    <div className="flex items-center gap-2 mb-2 text-blue-600">
                      <TrendingUp size={18} />
                      <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Extract Key Findings</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">Identify the most important data points and strategic takeaways.</p>
                  </button>

                  {/* Card 3 */}
                  <button 
                    onClick={() => setInput("Check Inconsistencies")}
                    className="p-5 text-left border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all bg-white group"
                  >
                    <div className="flex items-center gap-2 mb-2 text-blue-600">
                      <AlertTriangle size={18} />
                      <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Check Inconsistencies</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">Analyze documents to find conflicting information or errors.</p>
                  </button>

                  {/* Card 4 */}
                  <button 
                    onClick={() => setInput("Translate Content")}
                    className="p-5 text-left border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all bg-white group"
                  >
                    <div className="flex items-center gap-2 mb-2 text-blue-600">
                      <Globe size={18} />
                      <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Translate Content</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">Convert the analysis into multiple languages while preserving context.</p>
                  </button>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <MessageItem key={idx} msg={msg} idx={idx} onSourceClick={handleSourceClick} />
              ))
            )}

            {loading && (
              <div className="flex gap-4 w-full">
                <div className="w-8 h-8 shrink-0 rounded-full bg-white border border-border flex items-center justify-center mt-1 text-primary shadow-sm">
                  <span>🤖</span>
                </div>
                <div className="bg-white border border-border rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <ChatInput
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          selectedDocIds={selectedDocIds}
          loading={loading}
          documents={documents}
        />
      </div>

      <DocumentPreview previewDoc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </div>
  );
}
