import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Download, FileJson, Loader2 } from "lucide-react";
import { documentApi } from "@/services/api";
import { toast } from "react-hot-toast";

interface DataExtractionModalProps {
  docId: string;
  docName: string;
  onClose: () => void;
}

export default function DataExtractionModal({ docId, docName, onClose }: DataExtractionModalProps) {
  const [keysInput, setKeysInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleExtract = async () => {
    if (!keysInput.trim()) {
      toast.error("Vui lòng nhập các trường cần trích xuất");
      return;
    }

    // Tách các trường bằng dấu phẩy và làm sạch
    const keys = keysInput.split(",").map(k => k.trim()).filter(k => k.length > 0);
    
    if (keys.length === 0) {
      toast.error("Vui lòng nhập định dạng hợp lệ");
      return;
    }

    setLoading(true);
    try {
      const res = await documentApi.extract(docId, keys);
      setResult(res.data.data);
      toast.success("Trích xuất dữ liệu thành công");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi trích xuất dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const downloadJson = () => {
    if (!result) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `extracted_${docName}.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-slate-50">
          <h3 className="font-bold text-foreground">Trích xuất Dữ liệu</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Tài liệu: <span className="font-medium text-foreground">{docName}</span>
            </p>
            <label className="block text-sm font-medium mb-1">
              Nhập các trường cần trích xuất (ngăn cách bởi dấu phẩy)
            </label>
            <textarea
              className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              rows={3}
              placeholder="Ví dụ: Tên công ty, Mã số thuế, Tổng tiền, Ngày phát hành"
              value={keysInput}
              onChange={(e) => setKeysInput(e.target.value)}
              disabled={loading}
            />
          </div>

          {result && (
            <div className="mt-4 border border-border rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b border-border flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-2">
                  <FileJson size={16} className="text-blue-500" /> Kết quả
                </span>
                <button
                  onClick={downloadJson}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-border hover:bg-muted transition-colors flex items-center gap-1"
                >
                  <Download size={14} /> Tải xuống JSON
                </button>
              </div>
              <div className="p-4 bg-slate-900 text-slate-50 text-sm overflow-x-auto max-h-60 overflow-y-auto">
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleExtract}
              disabled={loading}
              className="px-6 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Đang xử lý...
                </>
              ) : (
                "Bắt đầu Trích xuất"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
