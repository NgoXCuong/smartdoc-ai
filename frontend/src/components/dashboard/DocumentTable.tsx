import React from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Loader2, FileText, Upload, Trash2, Pencil, Download, FolderOpen } from 'lucide-react';
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
    <section className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] overflow-hidden mb-12 transition-all">
      <div className="px-8 py-5 border-b border-slate-100/80 flex items-center justify-between bg-white/50">
        <h2 className="text-sm font-bold flex items-center gap-2 text-slate-800 uppercase tracking-wide">
          <Clock size={16} className="text-indigo-500" /> Tài liệu gần đây
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center p-24">
          <Loader2 className="animate-spin text-indigo-500/50" size={40} />
        </div>
      ) : documents.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                <th className="px-8 py-4 border-b border-slate-100 font-medium">Tên tài liệu</th>
                <th className="px-8 py-4 border-b border-slate-100 font-medium">Kích thước</th>
                <th className="px-8 py-4 border-b border-slate-100 font-medium">Trạng thái</th>
                <th className="px-8 py-4 border-b border-slate-100 font-medium">Ngày tạo</th>
                <th className="px-8 py-4 border-b border-slate-100 font-medium text-right">Thao tác</th>
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
          <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-indigo-100/50">
            <FileText className="text-indigo-400" size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2 text-slate-800 tracking-tight">Chưa có tài liệu nào</h3>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm font-medium">Bắt đầu không gian làm việc của bạn bằng cách tải lên tài liệu đầu tiên.</p>
          <label className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all cursor-pointer shadow-sm">
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
      <td className="px-8 py-4">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-colors",
            isProcessing ? "bg-amber-50 text-amber-500 border border-amber-100/50" : 
            isFailed ? "bg-red-50 text-red-500 border border-red-100/50" : 
            "bg-indigo-50 text-indigo-500 border border-indigo-100/50"
          )}>
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors" title={doc.fileName}>{doc.fileName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {doc.summary && !isProcessing && !isFailed ? (
                <p className="text-[13px] text-slate-500 line-clamp-1">{doc.summary}</p>
              ) : (
                <p className="text-[12px] text-slate-400 italic">
                  {isProcessing ? "Đang tóm tắt nội dung..." : isFailed ? "Không thể xử lý" : "Chưa có tóm tắt"}
                </p>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-8 py-4 text-[13px] font-medium text-slate-500">
        {doc.fileSize ? (doc.fileSize / 1024 / 1024).toFixed(2) : "0.00"} MB
      </td>
      <td className="px-8 py-4">
        <span className={cn(
          "px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide",
          isProcessing ? "bg-amber-50 text-amber-600 border border-amber-200/50" : 
          isFailed ? "bg-red-50 text-red-600 border border-red-200/50" : 
          "bg-emerald-50 text-emerald-600 border border-emerald-200/50"
        )}>
          {doc.status === 'completed' ? 'Hoàn thành' : isProcessing ? 'Đang xử lý' : 'Lỗi'}
        </span>
      </td>
      <td className="px-8 py-4 text-[13px] font-medium text-slate-500">
        {doc.createdAt && !isNaN(new Date(doc.createdAt).getTime())
          ? new Date(doc.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' })
          : "---"}
      </td>
      <td className="px-8 py-4 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={onMove}
            className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-700 transition-colors shadow-sm border border-transparent hover:border-slate-200"
            title="Di chuyển vào thư mục"
          >
            <FolderOpen size={16} />
          </button>
          <button className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-700 transition-colors shadow-sm border border-transparent hover:border-slate-200" title="Đổi tên">
            <Pencil size={16} />
          </button>
          <button className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-700 transition-colors shadow-sm border border-transparent hover:border-slate-200" title="Tải về">
            <Download size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors shadow-sm border border-transparent hover:border-red-100"
            title="Xóa"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}
