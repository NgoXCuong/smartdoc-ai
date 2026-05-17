import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Folder as FolderIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MoveDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDoc: any;
  folders: any[];
  handleMove: (folderId: string | null) => void;
}

export default function MoveDocumentModal({ isOpen, onClose, selectedDoc, folders, handleMove }: MoveDocumentModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-white rounded-[24px] w-full max-w-md p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Di chuyển tài liệu</h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <p className="text-[13px] text-slate-500 mb-6 font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-100/80 leading-relaxed">
              Chọn thư mục đích cho <br /><span className="text-slate-800 font-bold truncate inline-block align-bottom max-w-full mt-1">"{selectedDoc?.fileName}"</span>
            </p>

            <div className="space-y-2 max-h-[300px] overflow-y-auto mb-8 pr-2 custom-scrollbar">
              <button
                onClick={() => handleMove(null)}
                className={cn(
                  "w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 text-left group",
                  selectedDoc?.folderId === null ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold shadow-sm" : "border-transparent hover:border-slate-200 hover:bg-slate-50 text-slate-600"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                  selectedDoc?.folderId === null ? "bg-white text-indigo-600 shadow-sm" : "bg-slate-100 text-slate-400 group-hover:bg-white group-hover:shadow-sm"
                )}>
                  <FileText size={18} />
                </div>
                <span className="text-sm">Thư mục gốc (Root)</span>
              </button>

              {folders.map(folder => (
                <button
                  key={folder._id}
                  onClick={() => handleMove(folder._id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 text-left group",
                    selectedDoc?.folderId === folder._id ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold shadow-sm" : "border-transparent hover:border-slate-200 hover:bg-slate-50 text-slate-600"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center transition-colors shadow-sm",
                      selectedDoc?.folderId === folder._id ? "bg-white" : "group-hover:bg-white"
                    )}
                    style={{ color: folder.color || "#4f46e5", backgroundColor: selectedDoc?.folderId === folder._id ? 'white' : `${folder.color}15` || "#4f46e515" }}
                  >
                    <FolderIcon size={18} fill="currentColor" fillOpacity={0.2} />
                  </div>
                  <span className="truncate text-sm font-medium">{folder.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all shadow-sm"
            >
              Hủy bỏ
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
