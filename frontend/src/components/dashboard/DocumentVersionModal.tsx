"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  History,
  Upload,
  RotateCcw,
  CheckCircle2,
  FileText,
  Clock,
  User,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { documentApi } from "@/services/api";

interface DocumentVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    _id: string;
    fileName: string;
    version?: number;
  } | null;
  onVersionUpdated?: () => void;
}

export const DocumentVersionModal: React.FC<DocumentVersionModalProps> = ({
  isOpen,
  onClose,
  document,
  onVersionUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<"history" | "upload">("history");
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [historyData, setHistoryData] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [changeLog, setChangeLog] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && document?._id) {
      loadHistory();
      setActiveTab("history");
      setSelectedFile(null);
      setChangeLog("");
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [isOpen, document]);

  const loadHistory = async () => {
    if (!document?._id) return;
    try {
      setFetchingHistory(true);
      setErrorMsg("");
      const res = await documentApi.getVersions(document._id);
      if (res.data?.success) {
        setHistoryData(res.data);
      }
    } catch (err: any) {
      console.error("Lỗi lấy lịch sử phiên bản:", err);
      setErrorMsg(err.response?.data?.message || "Không thể tải lịch sử phiên bản");
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg("");
    }
  };

  const handleUploadVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !document?._id) {
      setErrorMsg("Vui lòng chọn tệp phiên bản mới");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      await documentApi.uploadVersion(document._id, selectedFile, changeLog);
      setSuccessMsg("Tải lên phiên bản mới thành công! Hệ thống đang tự động trích xuất RAG.");
      setSelectedFile(null);
      setChangeLog("");
      
      // Tải lại lịch sử và làm mới danh sách ngoài trang
      await loadHistory();
      if (onVersionUpdated) onVersionUpdated();
      
      setTimeout(() => {
        setActiveTab("history");
        setSuccessMsg("");
      }, 1500);
    } catch (err: any) {
      console.error("Lỗi upload phiên bản mới:", err);
      setErrorMsg(err.response?.data?.message || "Lỗi khi tải lên phiên bản mới");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version: number) => {
    if (!document?._id) return;
    if (!confirm(`Bạn có chắc chắn muốn khôi phục về phiên bản v${version}?`)) return;

    try {
      setRestoringVersion(version);
      setErrorMsg("");
      setSuccessMsg("");

      await documentApi.restoreVersion(document._id, version);
      setSuccessMsg(`Đã khôi phục thành công về phiên bản v${version}!`);
      
      await loadHistory();
      if (onVersionUpdated) onVersionUpdated();

      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err: any) {
      console.error("Lỗi khôi phục phiên bản:", err);
      setErrorMsg(err.response?.data?.message || "Không thể khôi phục phiên bản");
    } finally {
      setRestoringVersion(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || isNaN(bytes)) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (!isOpen || !document) return null;

  const currentVersionNum = historyData?.currentVersion || document.version || 1;
  const versionHistoryList = historyData?.versionHistory || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                Quản lý phiên bản tài liệu
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v{currentVersionNum}
                </span>
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-md" title={document.fileName}>
                {document.fileName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "history"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="w-4 h-4" />
            Lịch sử phiên bản ({versionHistoryList.length + 1})
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "upload"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Upload className="w-4 h-4" />
            Tải lên phiên bản mới
          </button>
        </div>

        {/* Notification alerts */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === "history" ? (
            fetchingHistory ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="text-xs">Đang tải lịch sử...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Current Active Version Item */}
                <div className="relative pl-6 pb-4 border-l-2 border-indigo-500">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-slate-900 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <div className="bg-slate-800/80 border border-indigo-500/30 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            v{currentVersionNum} (Hiện tại)
                          </span>
                          <span className="text-sm font-medium text-slate-200 truncate max-w-xs" title={historyData?.currentDocument?.fileName || document.fileName}>
                            {historyData?.currentDocument?.fileName || document.fileName}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-400 flex items-center gap-4">
                          <span>Kích thước: {formatFileSize(historyData?.currentDocument?.fileSize)}</span>
                          <span>Cập nhật: {formatDate(historyData?.currentDocument?.updatedAt)}</span>
                        </div>
                      </div>
                      <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium shrink-0">
                        Đang áp dụng
                      </span>
                    </div>
                  </div>
                </div>

                {/* History Timeline */}
                {versionHistoryList.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-4">
                    Chưa có phiên bản cũ nào được ghi lại.
                  </p>
                ) : (
                  [...versionHistoryList].reverse().map((item: any, idx: number) => (
                    <div key={idx} className="relative pl-6 pb-4 border-l-2 border-slate-700">
                      <div className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-slate-600 ring-4 ring-slate-900" />
                      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 hover:border-slate-600 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-700 text-slate-300">
                                v{item.version}
                              </span>
                              <span className="text-sm font-medium text-slate-300 truncate max-w-xs">
                                {item.fileName}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono bg-slate-900/50 p-2 rounded border border-slate-800 mt-1">
                              💬 {item.changeLog || "Không có ghi chú"}
                            </p>
                            <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-1">
                              <span>Dung lượng: {formatFileSize(item.fileSize)}</span>
                              <span>•</span>
                              <span>Ngày tải: {formatDate(item.createdAt)}</span>
                              {item.createdBy?.username && (
                                <>
                                  <span>•</span>
                                  <span>Bởi: {item.createdBy.username}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRestore(item.version)}
                            disabled={restoringVersion === item.version}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                          >
                            {restoringVersion === item.version ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5" />
                            )}
                            Khôi phục
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )
          ) : (
            /* Upload New Version Form */
            <form onSubmit={handleUploadVersion} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Chọn tệp phiên bản mới (v{(currentVersionNum + 1)})
                </label>
                <div className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-2xl p-6 transition-colors bg-slate-950/30 flex flex-col items-center justify-center text-center">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg"
                  />
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-full mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  {selectedFile ? (
                    <div>
                      <p className="text-sm font-medium text-indigo-300 truncate max-w-xs">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-slate-300 font-medium">
                        Kéo thả file vào đây hoặc <span className="text-indigo-400 underline">bấm để chọn</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Hỗ trợ PDF, DOCX, TXT, MD, Image
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Ghi chú những điểm thay đổi (Change Log)
                </label>
                <textarea
                  value={changeLog}
                  onChange={(e) => setChangeLog(e.target.value)}
                  placeholder="Ví dụ: Cập nhật nội dung chương 3, bổ sung điều khoản hợp đồng..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors h-24 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedFile}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang xử lý & Tạo Vector...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Cập nhật phiên bản v{currentVersionNum + 1}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
