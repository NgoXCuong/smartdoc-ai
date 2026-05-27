import React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, FileText, Upload, Eye, Download, MoreVertical } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface DocumentTableProps {
  documents: any[];
  loading: boolean;
  uploading: boolean;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDelete: (e: React.MouseEvent, docId: string) => void;
  onOpenMoveModal: (doc: any) => void;
}

export default function DocumentTable({ documents, loading, uploading, handleFileUpload, handleDelete, onOpenMoveModal }: DocumentTableProps) {
  const router = useRouter();

  return (
    <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-8 transition-all">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-slate-800">
          Tài liệu gần đây
        </h2>
        <button className="text-[13px] font-semibold text-blue-600 hover:text-blue-700">
          Xem tất cả
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-24">
          <Loader2 className="animate-spin text-blue-500/50" size={40} />
        </div>
      ) : documents.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4 font-semibold w-auto">Tên tài liệu</th>
                <th className="px-6 py-4 font-semibold w-[120px]">Kích thước</th>
                <th className="px-6 py-4 font-semibold w-[130px]">Trạng thái</th>
                <th className="px-6 py-4 font-semibold w-[120px]">Ngày tạo</th>
                <th className="px-6 py-4 font-semibold text-right w-[140px]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc: any) => (
                <DocumentRow
                  key={doc._id}
                  doc={doc}
                  onClick={() => {
                    if (doc.status === 'completed') {
                      router.push(`/chat?docId=${doc._id}`);
                    } else {
                      toast("Tài liệu đang được xử lý, vui lòng chờ đợi.", { icon: "⏳" });
                    }
                  }}
                  onDelete={(e) => handleDelete(e, doc._id)}
                  onMove={(e) => {
                    e.stopPropagation();
                    onOpenMoveModal(doc);
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
          <label className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 active:scale-95 transition-all cursor-pointer shadow-sm">
            <Upload size={18} />
            <span className="text-sm">Tải tài liệu lên</span>
            <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,.md,image/*" onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>
      )}
    </section>
  );
}

function DocumentRow({ doc, onClick, onDelete, onMove }: { doc: any, onClick: () => void, onDelete: (e: any) => void, onMove: (e: any) => void }) {
  const isProcessing = doc.status === "processing" || doc.status === "pending";
  const isFailed = doc.status === "failed";

  return (
    <tr
      onClick={onClick}
      className={cn(
        "group hover:bg-slate-50 transition-all duration-200 cursor-pointer border-b border-slate-100/60 last:border-0",
        isProcessing && "cursor-wait"
      )}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="text-blue-500">
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors" title={doc.fileName}>{doc.fileName}</p>
            <div className="flex flex-col gap-1 mt-0.5">
              {doc.summary && !isProcessing && !isFailed ? (
                <>
                  <p className="text-[12px] text-slate-500 line-clamp-1" title={doc.summary}>{doc.summary}</p>
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-0.5">
                      {doc.tags.map((tag: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-medium rounded border border-slate-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-1.5 mt-0.5">
                  <p className="text-[11px] text-slate-400 italic flex items-center gap-2">
                    {isProcessing ? (
                      <>Đang xử lý... <span className="font-semibold text-blue-500">{doc.progress || 0}%</span></>
                    ) : isFailed ? "Không thể xử lý" : "Chưa có tóm tắt"}
                  </p>
                  {isProcessing && (
                    <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-500 ease-out rounded-full" 
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
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={cn(
          "px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border",
          isProcessing ? "bg-amber-50 text-amber-600 border-amber-200/50" : 
          isFailed ? "bg-red-50 text-red-600 border-red-200/50" : 
          "bg-green-50 text-green-600 border-green-200/50"
        )}>
          {doc.status === 'completed' ? 'Hoàn thành' : isProcessing ? 'Đang xử lý' : 'Lỗi'}
        </span>
      </td>
      <td className="px-6 py-4 text-[12px] font-medium text-slate-500 whitespace-nowrap">
        {doc.createdAt && !isNaN(new Date(doc.createdAt).getTime())
          ? new Date(doc.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' })
          : "---"}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1.5 transition-opacity duration-200">
          <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Xem chi tiết">
            <Eye size={16} />
          </button>
          <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Tải về">
            <Download size={16} />
          </button>
          <button 
            onClick={onDelete}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
            title="Thao tác khác"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}
