"use client";

import React, { useState } from "react";
import { X, Share2, Mail, Calendar, Download, Trash2, Shield, Check, Clock, Eye, MessageSquare } from "lucide-react";
import { documentApi } from "@/services/api";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface ShareDocumentModalProps {
  doc: any;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ShareDocumentModal({ doc, onClose, onSuccess }: ShareDocumentModalProps) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "chat">("chat");
  const [expiresAt, setExpiresAt] = useState("");
  const [canDownload, setCanDownload] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sharedList, setSharedList] = useState<any[]>(doc.sharedWith || []);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Vui lòng nhập Email người nhận");
      return;
    }

    setLoading(true);
    try {
      const res = await documentApi.share(
        doc._id,
        email.trim(),
        permission,
        expiresAt ? new Date(expiresAt).toISOString() : null,
        canDownload
      );

      toast.success(`Đã chia sẻ tài liệu cho ${email}!`);
      if (res.data?.document?.sharedWith) {
        setSharedList(res.data.document.sharedWith);
      }
      setEmail("");
      setExpiresAt("");
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi chia sẻ tài liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (targetEmail: string) => {
    try {
      const res = await documentApi.removeShare(doc._id, targetEmail);
      toast.success(`Đã hủy chia sẻ với ${targetEmail}`);
      if (res.data?.document?.sharedWith) {
        setSharedList(res.data.document.sharedWith);
      } else {
        setSharedList((prev) => prev.filter((s) => (s.user?.email || s.user) !== targetEmail));
      }
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi hủy chia sẻ");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <Share2 size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-800 truncate" title={doc.fileName}>
                Chia sẻ tài liệu
              </h3>
              <p className="text-[11px] text-slate-400 font-medium truncate">
                {doc.fileName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Form Chia Sẻ Mới */}
          <form onSubmit={handleShare} className="space-y-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail size={14} className="text-indigo-600" />
                Email người nhận <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="nhapemail@congty.com"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Quyền hạn */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Shield size={14} className="text-indigo-600" />
                  Quyền truy cập
                </label>
                <select
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 bg-white outline-none focus:border-indigo-500 cursor-pointer"
                  value={permission}
                  onChange={(e: any) => setPermission(e.target.value)}
                >
                  <option value="chat">Hội thoại RAG & Xem</option>
                  <option value="view">Chỉ xem tài liệu</option>
                </select>
              </div>

              {/* Ngày hết hạn (Expires Date) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar size={14} className="text-indigo-600" />
                  Hạn chia sẻ (Tùy chọn)
                </label>
                <input
                  type="date"
                  className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 bg-white outline-none focus:border-indigo-500"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>

            {/* Toggle switch: Cho phép tải file về không */}
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2">
                <Download size={15} className="text-indigo-600" />
                <span className="text-xs font-bold text-slate-700">Cho phép tải tệp về máy</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={canDownload}
                  onChange={(e) => setCanDownload(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-200 disabled:opacity-50 active:scale-[0.98]"
            >
              <Share2 size={14} />
              {loading ? "Đang gửi chia sẻ..." : "Xác nhận chia sẻ"}
            </button>
          </form>

          {/* Danh sách đã chia sẻ */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Đang chia sẻ với ({sharedList.length})
            </h4>

            {sharedList.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {sharedList.map((item: any, idx: number) => {
                  const targetUser = item.user || {};
                  const userEmail = targetUser.email || item.email || "N/A";
                  const isExpired = item.expiresAt && new Date() > new Date(item.expiresAt);

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {(targetUser.name || userEmail).substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {targetUser.name || userEmail}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              {item.permission === "chat" ? (
                                <>
                                  <MessageSquare size={10} className="text-indigo-600" /> RAG Chat
                                </>
                              ) : (
                                <>
                                  <Eye size={10} className="text-slate-500" /> Chỉ xem
                                </>
                              )}
                            </span>
                            <span>•</span>
                            <span>{item.canDownload ? "Có thể tải về" : "Không được tải"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.expiresAt && (
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                              isExpired
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            )}
                          >
                            <Clock size={10} />
                            {isExpired ? "Đã hết hạn" : new Date(item.expiresAt).toLocaleDateString("vi-VN")}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveShare(userEmail)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Gỡ chia sẻ"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl">
                Tài liệu này chưa được chia sẻ với ai.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
