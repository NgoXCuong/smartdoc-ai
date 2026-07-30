import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, FileText, Upload, Eye, Download, Share2, Cpu, Trash2, History, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import DocumentProcessingTrackerModal from './DocumentProcessingTrackerModal';
import ShareDocumentModal from './ShareDocumentModal';
import { DocumentVersionModal } from './DocumentVersionModal';
import DocumentDetailModal from './DocumentDetailModal';

interface DocumentTableProps {
  documents: any[];
  loading: boolean;
  handleDelete: (e: React.MouseEvent, docId: string) => void;
  onOpenMoveModal: (doc: any) => void;
  onRefresh?: () => void;
}

export default function DocumentTable({ documents, loading, handleDelete, onOpenMoveModal, onRefresh }: DocumentTableProps) {
  const router = useRouter();
  const [selectedTrackerDoc, setSelectedTrackerDoc] = useState<any>(null);
  const [selectedShareDoc, setSelectedShareDoc] = useState<any>(null);
  const [selectedVersionDoc, setSelectedVersionDoc] = useState<any>(null);
  const [selectedDetailDoc, setSelectedDetailDoc] = useState<any>(null);

  return (
    <>
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-8 transition-all shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">
              Danh sách tài liệu đã tải lên
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
              {documents.length} tập tin
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-24">
            <Loader2 className="animate-spin text-blue-500/50" size={40} />
          </div>
        ) : documents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 font-semibold w-auto">Tên tài liệu</th>
                  <th className="px-6 py-4 font-semibold w-[110px]">Kích thước</th>
                  <th className="px-6 py-4 font-semibold w-[160px]">Trạng thái RAG</th>
                  <th className="px-6 py-4 font-semibold w-[120px]">Ngày tạo</th>
                  <th className="px-6 py-4 font-semibold text-right w-[300px]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc: any) => (
                  <DocumentRow
                    key={doc._id}
                    doc={doc}
                    onClick={() => setSelectedDetailDoc(doc)}
                    onStartChat={(e) => {
                      e.stopPropagation();
                      router.push(`/chat?docId=${doc._id}`);
                    }}
                    onDelete={(e) => handleDelete(e, doc._id)}
                    onOpenTracker={(e) => {
                      e.stopPropagation();
                      setSelectedTrackerDoc(doc);
                    }}
                    onOpenShare={(e) => {
                      e.stopPropagation();
                      setSelectedShareDoc(doc);
                    }}
                    onOpenVersion={(e) => {
                      e.stopPropagation();
                      setSelectedVersionDoc(doc);
                    }}
                    onOpenDetail={(e) => {
                      e.stopPropagation();
                      setSelectedDetailDoc(doc);
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-24 bg-slate-50/30">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-100/50">
              <FileText className="text-blue-400" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-800 tracking-tight">Chưa có tài liệu nào</h3>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm font-medium">Bắt đầu không gian làm việc của bạn bằng cách tải lên tài liệu đầu tiên.</p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('trigger-upload'))}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
            >
              <Upload size={18} />
              <span className="text-sm">Tải tài liệu lên</span>
            </button>
          </div>
        )}
      </section>

      {/* Document Detail Modal */}
      {selectedDetailDoc && (
        <DocumentDetailModal
          isOpen={!!selectedDetailDoc}
          document={selectedDetailDoc}
          onClose={() => setSelectedDetailDoc(null)}
          onOpenShare={() => {
            setSelectedShareDoc(selectedDetailDoc);
          }}
          onOpenVersion={() => {
            setSelectedVersionDoc(selectedDetailDoc);
          }}
        />
      )}

      {/* Tracker Modal */}
      {selectedTrackerDoc && (
        <DocumentProcessingTrackerModal
          doc={selectedTrackerDoc}
          onClose={() => setSelectedTrackerDoc(null)}
        />
      )}

      {/* Share Modal */}
      {selectedShareDoc && (
        <ShareDocumentModal
          doc={selectedShareDoc}
          onClose={() => setSelectedShareDoc(null)}
        />
      )}

      {/* Version Management Modal */}
      {selectedVersionDoc && (
        <DocumentVersionModal
          isOpen={!!selectedVersionDoc}
          document={selectedVersionDoc}
          onClose={() => setSelectedVersionDoc(null)}
          onVersionUpdated={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </>
  );
}

function DocumentRow({
  doc,
  onClick,
  onStartChat,
  onDelete,
  onOpenTracker,
  onOpenShare,
  onOpenVersion,
  onOpenDetail,
}: {
  doc: any;
  onClick: () => void;
  onStartChat: (e: any) => void;
  onDelete: (e: any) => void;
  onOpenTracker: (e: any) => void;
  onOpenShare: (e: any) => void;
  onOpenVersion: (e: any) => void;
  onOpenDetail: (e: any) => void;
}) {
  const isProcessing = doc.status === "processing" || doc.status === "pending";
  const isFailed = doc.status === "failed";
  const versionNum = doc.version || 1;

  const fileNameLower = (doc.fileName || "").toLowerCase();
  const isPdf = fileNameLower.endsWith(".pdf");
  const isDocx = fileNameLower.endsWith(".docx") || fileNameLower.endsWith(".doc");
  const isTxt = fileNameLower.endsWith(".txt") || fileNameLower.endsWith(".md");

  const chunksCount = (doc.fileSize ? Math.ceil(doc.fileSize / 1500) : 45);

  return (
    <tr
      onClick={onClick}
      className={cn(
        "group hover:bg-blue-50/40 transition-all duration-200 cursor-pointer border-b border-slate-100/60 last:border-0",
        isProcessing && "cursor-wait"
      )}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            {isProcessing ? (
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-indigo-600" />
              </div>
            ) : isPdf ? (
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs shadow-xs">
                PDF
              </div>
            ) : isDocx ? (
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shadow-xs">
                DOC
              </div>
            ) : isTxt ? (
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shadow-xs">
                TXT
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                <FileText size={20} />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-800 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors" title={doc.fileName}>{doc.fileName}</p>
              <span 
                onClick={onOpenVersion}
                className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-50 text-indigo-600 border border-indigo-200/80 hover:bg-indigo-100 transition-colors shrink-0"
                title="Phiên bản tài liệu - Nhấp để xem lịch sử & cập nhật"
              >
                v{versionNum}
              </span>
            </div>
            <div className="flex flex-col gap-1 mt-0.5">
              {doc.summary && !isProcessing && !isFailed ? (
                <>
                  <p className="text-[12px] text-slate-500 line-clamp-1" title={doc.summary}>{doc.summary}</p>
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-0.5">
                      {doc.tags.map((tag: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-medium rounded border border-slate-200">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-1.5 mt-0.5">
                  <p className="text-[11px] text-slate-400 italic flex items-center gap-2">
                    {isProcessing ? (
                      <>Đang xử lý Pipeline AI... <span className="font-semibold text-indigo-600">{doc.progress || 0}%</span></>
                    ) : isFailed ? "Không thể xử lý" : "Chưa có tóm tắt AI"}
                  </p>
                  {isProcessing && (
                    <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 transition-all duration-500 ease-out rounded-full" 
                        style={{ width: `${doc.progress || 0}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 text-[12px] font-medium text-slate-500 whitespace-nowrap">
        {doc.fileSize ? (doc.fileSize / 1024 / 1024).toFixed(2) : "0.00"} MB
      </td>

      {/* AI Ready Trạng thái */}
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={onOpenTracker}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide border transition-all hover:scale-105 shadow-2xs",
            isProcessing
              ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
              : isFailed
              ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
              : "bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100"
          )}
          title={`Trạng thái: ${doc.status === "completed" ? "Sẵn sàng RAG" : "Đang xử lý"} - Nhấp để xem tiến trình kỹ thuật`}
        >
          {doc.status === "completed" ? (
            <>
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>AI Ready</span>
              <span className="text-[10px] font-semibold text-emerald-600/80 border-l border-emerald-300 pl-1.5 ml-0.5">
                {chunksCount} chunks
              </span>
            </>
          ) : isProcessing ? (
            <>
              <Loader2 size={13} className="animate-spin text-amber-600" />
              <span>Đang xử lý ({doc.progress || 0}%)</span>
            </>
          ) : (
            <>
              <AlertCircle size={13} className="text-rose-600" />
              <span>Lỗi xử lý</span>
            </>
          )}
        </button>
      </td>

      <td className="px-6 py-4 text-[12px] font-medium text-slate-500 whitespace-nowrap">
        {doc.createdAt && !isNaN(new Date(doc.createdAt).getTime())
          ? new Date(doc.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' })
          : "---"}
      </td>

      {/* Thao tác: Tất cả dùng Icon chuẩn đẹp */}
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {doc.status === "completed" && (
            <button
              onClick={onStartChat}
              className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl transition-colors"
              title="Chat với AI (Hỏi đáp dựa trên tài liệu)"
            >
              <Sparkles size={15} />
            </button>
          )}

          <button
            onClick={onOpenDetail}
            className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl transition-colors"
            title="Xem chi tiết tài liệu & phân tích AI"
          >
            <Eye size={15} />
          </button>

          <button
            onClick={onOpenVersion}
            className="p-2 text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/60 rounded-xl transition-colors"
            title="Quản lý phiên bản"
          >
            <History size={15} />
          </button>

          <button
            onClick={onOpenShare}
            className="p-2 text-blue-600 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/60 rounded-xl transition-colors"
            title="Chia sẻ tài liệu"
          >
            <Share2 size={15} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (doc.fileUrl) {
                window.open(doc.fileUrl, "_blank");
              }
            }}
            className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl transition-colors"
            title="Tải xuống tệp tin gốc"
          >
            <Download size={15} />
          </button>

          <button 
            onClick={onDelete}
            className="p-2 text-rose-600 bg-rose-50/80 hover:bg-rose-100 border border-rose-200/60 rounded-xl transition-colors" 
            title="Xóa tài liệu"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}
