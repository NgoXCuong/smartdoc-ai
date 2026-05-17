import React, { useState } from "react";
import { workspaceApi } from "@/services/api";
import { toast } from "react-hot-toast";
import { X, Building, Mail, Trash2 } from "lucide-react";

interface WorkspaceModalProps {
  onClose: () => void;
  onSuccess: () => void;
  workspace?: any | null; // Nếu có truyền vào nghĩa là Edit
}

export default function WorkspaceModal({ onClose, onSuccess, workspace }: WorkspaceModalProps) {
  const [name, setName] = useState(workspace?.name || "");
  const [description, setDescription] = useState(workspace?.description || "");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      if (workspace) {
        await workspaceApi.update(workspace._id, { name, description });
        toast.success("Cập nhật thành công");
      } else {
        await workspaceApi.create(name, description);
        toast.success("Tạo tổ chức thành công");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !workspace) return;

    setLoading(true);
    try {
      await workspaceApi.addMember(workspace._id, email, role);
      toast.success("Đã mời thành viên");
      setEmail("");
      onSuccess(); // Cập nhật lại danh sách thành viên (lấy từ cha)
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi mời thành viên");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!workspace) return;
    setLoading(true);
    try {
      await workspaceApi.removeMember(workspace._id, memberId);
      toast.success("Đã xóa thành viên");
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi xóa thành viên");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-slate-50">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Building className="text-indigo-600" size={20} />
            {workspace ? "Quản lý Tổ chức" : "Tạo Tổ chức mới"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Tên tổ chức <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                className="w-full border border-border rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none transition-colors"
                placeholder="Ví dụ: Công ty TNHH SmartDoc"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Mô tả</label>
              <textarea
                className="w-full border border-border rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none transition-colors resize-none h-20"
                placeholder="Mô tả ngắn gọn về tổ chức..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <button
              disabled={loading}
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : workspace ? "Lưu thay đổi" : "Tạo Tổ chức"}
            </button>
          </form>

          {workspace && (
            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="text-sm font-bold text-foreground mb-4">Thành viên</h3>
              
              <form onSubmit={handleAddMember} className="flex gap-2 mb-4">
                <input
                  type="email"
                  required
                  placeholder="Email người được mời"
                  className="flex-1 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <select 
                  className="border border-border rounded-lg px-2 text-sm outline-none"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="viewer">Người xem</option>
                  <option value="editor">Người sửa</option>
                  <option value="admin">Quản trị</option>
                </select>
                <button type="submit" disabled={loading} className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  Mời
                </button>
              </form>

              <div className="space-y-2">
                {workspace.members?.map((member: any) => (
                  <div key={member.user._id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                        {member.user.email.substring(0, 2)}
                      </div>
                      <div>
                        <div className="text-sm font-medium leading-none">{member.user.username || member.user.email.split("@")[0]}</div>
                        <div className="text-xs text-muted-foreground mt-1">{member.role}</div>
                      </div>
                    </div>
                    {workspace.ownerId !== member.user._id && (
                       <button onClick={() => handleRemoveMember(member.user._id)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                         <Trash2 size={16} />
                       </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
