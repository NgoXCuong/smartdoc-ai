import React, { useState, useRef } from "react";
import { workspaceApi } from "@/services/api";
import { toast } from "react-hot-toast";
import {
  X,
  Building,
  Mail,
  Trash2,
  Link as LinkIcon,
  Copy,
  RefreshCw,
  Sparkles,
  UploadCloud,
  Check,
  Users,
  Settings as SettingsIcon,
  Shield,
  UserCheck,
  Crown,
  Search,
  ExternalLink,
  Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkspaceModalProps {
  onClose: () => void;
  onSuccess: () => void;
  workspace?: any | null; // Nếu có truyền vào nghĩa là Edit
}

export default function WorkspaceModal({ onClose, onSuccess, workspace }: WorkspaceModalProps) {
  const [activeTab, setActiveTab] = useState<"info" | "invite" | "members">(
    workspace ? "info" : "info"
  );

  const [name, setName] = useState(workspace?.name || "");
  const [description, setDescription] = useState(workspace?.description || "");
  const [avatar, setAvatar] = useState(workspace?.avatar || "");
  const [inviteCode, setInviteCode] = useState(workspace?.inviteCode || "");
  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [memberSearch, setMemberSearch] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Xử lý Upload Ảnh từ máy tính
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh (PNG, JPG, WEBP,...)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh không vượt quá 5MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const res = await workspaceApi.uploadAvatarFile(file);
      const uploadedUrl = res.data.avatarUrl;
      setAvatar(uploadedUrl);
      toast.success("Đã tải ảnh đại diện lên thành công!");
      
      // Nếu đang edit workspace có sẵn, tự động cập nhật avatar ngay
      if (workspace?._id) {
        await workspaceApi.updateAvatar(workspace._id, uploadedUrl);
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi tải ảnh lên");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên Workspace");
      return;
    }

    setLoading(true);
    try {
      if (workspace) {
        await workspaceApi.update(workspace._id, { name, description, avatar });
        toast.success("Đã cập nhật thông tin Workspace!");
      } else {
        await workspaceApi.create(name, description);
        toast.success("Tạo tổ chức mới thành công!");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInviteCode = async () => {
    if (!workspace) return;
    setInviteLoading(true);
    try {
      const res = await workspaceApi.generateInviteCode(workspace._id);
      setInviteCode(res.data.inviteCode);
      toast.success(inviteCode ? "Đã làm mới mã mời!" : "Đã tạo mã mời thành công!");
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi tạo mã mời");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!inviteCode) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const joinUrl = `${origin}/join-workspace/${inviteCode}`;
    navigator.clipboard.writeText(joinUrl);
    toast.success("Đã sao chép link mời vào bộ nhớ tạm!");
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !workspace) return;

    setLoading(true);
    try {
      await workspaceApi.addMember(workspace._id, email, role);
      toast.success(`Đã thêm ${email} vào Workspace!`);
      setEmail("");
      onSuccess();
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
      toast.success("Đã xóa thành viên khỏi Workspace");
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi xóa thành viên");
    } finally {
      setLoading(false);
    }
  };

  const inviteUrl = inviteCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/join-workspace/${inviteCode}`
    : "";

  const membersList = workspace?.members || [];
  const filteredMembers = membersList.filter((m: any) => {
    const searchLower = memberSearch.toLowerCase();
    const username = m.user?.username || "";
    const memberEmail = m.user?.email || "";
    return username.toLowerCase().includes(searchLower) || memberEmail.toLowerCase().includes(searchLower);
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-100">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 overflow-hidden shrink-0">
              {avatar ? (
                <img src={avatar} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building size={20} />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 leading-tight flex items-center gap-2">
                {workspace ? workspace.name : "Tạo Tổ chức mới"}
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {workspace ? "Cài đặt & quản lý không gian làm việc" : "Thiết lập workspace cho nhóm của bạn"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Horizontal Navigation Tabs (Nằm ngang cực kỳ gọn gàng) */}
        {workspace && (
          <div className="flex items-center gap-2 px-6 pt-3 pb-1 border-b border-slate-100 bg-white">
            <button
              onClick={() => setActiveTab("info")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all relative",
                activeTab === "info"
                  ? "bg-indigo-50 text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              <SettingsIcon size={16} />
              Thông tin chung
            </button>

            <button
              onClick={() => setActiveTab("invite")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all relative",
                activeTab === "invite"
                  ? "bg-indigo-50 text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              <LinkIcon size={16} />
              Mã mời & Link
              {inviteCode && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("members")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all relative",
                activeTab === "members"
                  ? "bg-indigo-50 text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              <Users size={16} />
              Thành viên
              <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-extrabold ml-1">
                {membersList.length}
              </span>
            </button>
          </div>
        )}

        {/* Modal Main Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/30">
          
          {/* TAB 1: THÔNG TIN CHUNG & UPLOAD ANH */}
          {activeTab === "info" && (
            <form onSubmit={handleSubmitInfo} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Cột trái: Ảnh đại diện Workspace (Chọn từ máy) */}
                <div className="md:col-span-1 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center justify-center text-center">
                  <label className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5 self-start">
                    <ImageIcon size={15} className="text-indigo-600" />
                    Ảnh đại diện Workspace
                  </label>

                  {/* Avatar Preview Box */}
                  <div className="relative group w-32 h-32 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-indigo-100 overflow-hidden mb-4 border-2 border-white">
                    {avatar ? (
                      <img src={avatar} alt="Workspace Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{name ? name.substring(0, 2).toUpperCase() : "WS"}</span>
                    )}

                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-xs">
                        <RefreshCw size={24} className="animate-spin text-white" />
                      </div>
                    )}
                  </div>

                  {/* Input File ẩn */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  {/* Nút bấm chọn từ máy */}
                  <div className="w-full space-y-2">
                    <button
                      type="button"
                      disabled={uploadingAvatar}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      <UploadCloud size={15} />
                      {uploadingAvatar ? "Đang tải ảnh..." : "Chọn ảnh từ máy"}
                    </button>

                    {avatar && (
                      <button
                        type="button"
                        onClick={() => setAvatar("")}
                        className="w-full text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-bold py-1.5 px-3 rounded-xl text-[11px] transition-colors"
                      >
                        Gỡ ảnh
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-[11px] font-semibold text-slate-400 hover:text-indigo-600 transition-colors block mx-auto underline pt-1"
                    >
                      {showUrlInput ? "Ẩn URL trực tiếp" : "Nhập URL ảnh?"}
                    </button>

                    {showUrlInput && (
                      <input
                        type="text"
                        className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-500 transition-colors mt-2"
                        placeholder="https://example.com/avatar.jpg"
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                      />
                    )}
                  </div>
                </div>

                {/* Cột phải: Thông tin Tên & Mô tả */}
                <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Tên tổ chức <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                        placeholder="Ví dụ: Công ty TNHH SmartDoc"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Mô tả Workspace</label>
                      <textarea
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none h-28"
                        placeholder="Mô tả mục tiêu, dự án hoặc thành viên phòng ban..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      disabled={loading}
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-200 text-xs disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Check size={15} />
                          {workspace ? "Lưu thay đổi" : "Tạo Tổ chức mới"}
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            </form>
          )}

          {/* TAB 2: MÃ MỜI & LINK THAM GIA CÔNG KHAI */}
          {activeTab === "invite" && workspace && (
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-slate-50 p-6 rounded-2xl border border-indigo-100 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
                      <LinkIcon size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                        Mã Mời & Link Tham Gia Công Khai
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Bất kỳ ai sở hữu link này đều có thể đăng nhập và gia nhập Workspace của bạn.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateInviteCode}
                    disabled={inviteLoading}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    <RefreshCw size={13} className={inviteLoading ? "animate-spin" : ""} />
                    {inviteCode ? "Đổi mã mới" : "Tạo mã mới"}
                  </button>
                </div>

                {inviteCode ? (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-2xl border border-indigo-200 shadow-sm">
                      <input
                        type="text"
                        readOnly
                        value={inviteUrl}
                        className="flex-1 bg-transparent text-xs font-mono text-indigo-950 font-bold px-2 outline-none select-all"
                      />
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 shrink-0 active:scale-95"
                      >
                        <Copy size={14} />
                        Sao chép Link
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 bg-white/60 p-3 rounded-xl border border-slate-100">
                      <span className="font-semibold text-slate-700">Mã tham gia thủ công:</span>
                      <code className="font-mono bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg font-black text-sm tracking-wider">
                        {inviteCode}
                      </code>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-white rounded-2xl border border-slate-200/80 text-center space-y-3">
                    <Sparkles size={28} className="mx-auto text-indigo-500 animate-bounce" />
                    <p className="text-xs font-medium text-slate-600">
                      Chưa có đường dẫn tham gia công khai cho Workspace này.
                    </p>
                    <button
                      type="button"
                      onClick={handleGenerateInviteCode}
                      disabled={inviteLoading}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 shadow-md shadow-indigo-200"
                    >
                      <Sparkles size={15} />
                      Tạo Link Tham Gia Ngay
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200/60 text-xs text-slate-600 space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Shield size={14} className="text-indigo-600" />
                  Quyền hạn thành viên qua Link công khai:
                </div>
                <p className="leading-relaxed pl-5 text-slate-500">
                  Thành viên gia nhập thông qua đường dẫn công khai sẽ có vai trò <strong>Viewer (Người xem)</strong>. Bạn có thể thay đổi quyền hạn của họ sau trong tab "Thành viên".
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: QUẢN LÝ THÀNH VIÊN */}
          {activeTab === "members" && workspace && (
            <div className="space-y-5">
              
              {/* Form Mời thành viên trực tiếp */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Mail size={14} className="text-indigo-600" />
                  Mời thành viên trực tiếp qua Email
                </label>

                <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    placeholder="nhapemail@congty.com"
                    className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <select
                    className="border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none font-bold text-slate-700 bg-slate-50 cursor-pointer"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="viewer">Viewer (Người xem)</option>
                    <option value="editor">Editor (Biên tập)</option>
                    <option value="admin">Admin (Quản trị)</option>
                  </select>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-50 transition-all shadow-sm shadow-indigo-200 shrink-0"
                  >
                    Mời thành viên
                  </button>
                </form>
              </div>

              {/* Danh sách thành viên */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Danh sách Thành viên ({membersList.length})
                  </h3>

                  {/* Thanh tìm kiếm thành viên */}
                  {membersList.length > 3 && (
                    <div className="relative w-48">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Tìm thành viên..."
                        className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {filteredMembers.map((member: any) => {
                    const isOwner = workspace.ownerId === member.user?._id || workspace.ownerId?._id === member.user?._id;
                    const u = member.user || {};

                    return (
                      <div
                        key={u._id || member._id}
                        className="flex items-center justify-between p-3 bg-slate-50/80 hover:bg-slate-100/80 rounded-xl border border-slate-100 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm overflow-hidden shrink-0">
                            {u.avatarUrl || u.avatar ? (
                              <img src={u.avatarUrl || u.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              (u.username || u.email || "U").substring(0, 2)
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 leading-tight truncate flex items-center gap-1.5">
                              {u.username || u.email || "Thành viên"}
                              {isOwner && (
                                <span title="Chủ sở hữu">
                                  <Crown size={12} className="text-amber-500 fill-amber-500 shrink-0" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {u.email}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider",
                              isOwner
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : member.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : member.role === "editor"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-200 text-slate-700"
                            )}
                          >
                            {isOwner ? "Owner" : member.role}
                          </span>

                          {!isOwner && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(u._id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Xóa thành viên"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {filteredMembers.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400 italic">
                      Không tìm thấy thành viên phù hợp
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
