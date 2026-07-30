import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Tự động đính kèm token vào header Authorization
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("accessToken") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Biến kiểm soát trạng thái đang refresh token để tránh gọi nhiều lần
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Xử lý lỗi từ server (ví dụ: Token hết hạn)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Bỏ qua lỗi 401 nếu đó là request login hoặc refresh-token
    if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh-token')) {
      return Promise.reject(error);
    }

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gọi API refresh token
        const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, { withCredentials: true });
        
        if (res.status === 200) {
          const newToken = res.data.accessToken;
          if (typeof window !== 'undefined') {
            localStorage.setItem("accessToken", newToken);
          }
          apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          processQueue(null, newToken);
          return apiClient(originalRequest);
        }
      } catch (err) {
        processQueue(err, null);
        // Refresh token cũng hết hạn -> Bắt buộc login lại
        if (typeof window !== 'undefined') {
          localStorage.removeItem("user");
          localStorage.removeItem("accessToken");
          window.location.href = "/auth";
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: any) => apiClient.post("/auth/login", data),
  register: (data: any) => apiClient.post("/auth/register", data),
  getMe: () => apiClient.get("/auth/me"),
  logout: () => apiClient.post("/auth/logout"),
  changePassword: (data: any) => apiClient.put("/auth/change-password", data),
  forgotPassword: (data: { email: string }) => apiClient.post("/auth/forgot-password", data),
  resetPassword: (token: string, data: any) => apiClient.post(`/auth/reset-password/${token}`, data),
  verifyEmail: (token: string) => apiClient.get(`/auth/verify-email/${token}`),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return apiClient.post("/auth/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  removeAvatar: () => apiClient.delete("/auth/avatar"),
};

export const documentApi = {
  upload: (file: File, workspaceId?: string | null, folderId?: string | null) => {
    const formData = new FormData();
    formData.append("file", file);
    if (workspaceId) {
      formData.append("workspaceId", workspaceId);
    }
    if (folderId) {
      formData.append("folderId", folderId);
    }
    return apiClient.post("/docs/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getAll: (page = 1, limit = 10, search = "", folderId = "", workspaceId = "") => 
    apiClient.get(`/docs?page=${page}&limit=${limit}&search=${search}&folderId=${folderId}&workspaceId=${workspaceId}`),
  getInfo: (id: string) => apiClient.get(`/docs/${id}`),
  getJob: (id: string) => apiClient.get(`/docs/${id}/job`),
  delete: (id: string) => apiClient.delete(`/docs/${id}`),
  share: (id: string, email: string, permission = "view", expiresAt?: string | null, canDownload = true) =>
    apiClient.post(`/docs/${id}/share`, { email, permission, expiresAt, canDownload }),
  removeShare: (id: string, email: string) => apiClient.delete(`/docs/${id}/share/${email}`),
  extract: (id: string, keys: string[]) => apiClient.post(`/docs/${id}/extract`, { keys }),
  uploadVersion: (id: string, file: File, changeLog?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (changeLog) {
      formData.append("changeLog", changeLog);
    }
    return apiClient.post(`/docs/${id}/versions`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getVersions: (id: string) => apiClient.get(`/docs/${id}/versions`),
  restoreVersion: (id: string, version: number) => apiClient.post(`/docs/${id}/restore/${version}`),
};

export const chatApi = {
  ask: (question: string, docIds: string[], sessionId?: string) => 
    apiClient.post("/chat/ask", { question, docIds, sessionId }),
  getSessions: () => apiClient.get("/chat/history"),
  getHistory: (sessionId: string) => apiClient.get(`/chat/history/${sessionId}`),
  updateSession: (sessionId: string, data: any) => apiClient.patch(`/chat/history/${sessionId}`, data),
  deleteSession: (sessionId: string) => apiClient.delete(`/chat/history/${sessionId}`),
  
  askStreaming: async (question: string, docIds: string[], sessionId: string | null, onChunk: (data: any) => void) => {
    const token = localStorage.getItem("accessToken");
    const response = await fetch(`${API_BASE_URL}/chat/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ question, docIds, sessionId, stream: true })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Lỗi kết nối");
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error("Không thể đọc luồng dữ liệu");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.substring(6);
          if (dataStr === '[DONE]') {
            onChunk({ type: 'done' });
            continue;
          }
          try {
            const data = JSON.parse(dataStr);
            onChunk(data);
          } catch (e) {
            console.error("Error parsing SSE data:", e);
          }
        }
      }
    }
  }
};

export const folderApi = {
  getAll: (parentFolderId?: string | null, workspaceId?: string | null) => {
    let url = "/folders?";
    if (parentFolderId !== undefined && parentFolderId !== null) {
      url += `parentFolderId=${parentFolderId}&`;
    }
    if (workspaceId) {
      url += `workspaceId=${workspaceId}&`;
    }
    return apiClient.get(url);
  },
  getById: (id: string) => apiClient.get(`/folders/${id}`),
  getBreadcrumbs: (id: string) => apiClient.get(`/folders/${id}/breadcrumbs`),
  create: (name: string, color?: string, parentFolderId?: string | null, workspaceId?: string | null) => 
    apiClient.post("/folders", { name, color, parentFolderId: parentFolderId || null, workspaceId: workspaceId || null }),
  update: (id: string, data: any) => apiClient.patch(`/folders/${id}`, data),
  delete: (id: string) => apiClient.delete(`/folders/${id}`),
  moveDocument: (docId: string, folderId: string | null) => apiClient.post("/folders/move", { docId, folderId }),
  moveFolder: (folderId: string, targetParentFolderId: string | null) => apiClient.post("/folders/move-folder", { folderId, targetParentFolderId }),
};

export const adminApi = {
  getStats: () => apiClient.get("/admin/stats"),
  getUsers: () => apiClient.get("/admin/users"),
  updateUser: (id: string, data: any) => apiClient.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => apiClient.delete(`/admin/users/${id}`),
  getUsage: () => apiClient.get("/admin/usage"),
};

export const workspaceApi = {
  getAll: () => apiClient.get("/workspaces"),
  getById: (id: string) => apiClient.get(`/workspaces/${id}`),
  create: (name: string, description: string) => apiClient.post("/workspaces", { name, description }),
  update: (id: string, data: any) => apiClient.put(`/workspaces/${id}`, data),
  delete: (id: string) => apiClient.delete(`/workspaces/${id}`),
  addMember: (id: string, email: string, role: string) => apiClient.post(`/workspaces/${id}/members`, { email, role }),
  removeMember: (id: string, memberId: string) => apiClient.delete(`/workspaces/${id}/members/${memberId}`),
  generateInviteCode: (id: string) => apiClient.post(`/workspaces/${id}/invite-code`),
  getByInviteCode: (code: string) => apiClient.get(`/workspaces/invite-info/${code}`),
  joinByInviteCode: (code: string) => apiClient.post(`/workspaces/join/${code}`),
  updateAvatar: (id: string, avatar: string) => apiClient.post(`/workspaces/${id}/avatar`, { avatar }),
  uploadAvatarFile: (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return apiClient.post("/workspaces/upload-avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const groupChatApi = {
  getHistory: (workspaceId: string, page = 1, limit = 30) =>
    apiClient.get(`/workspaces/${workspaceId}/chat?page=${page}&limit=${limit}`),
  deleteMessage: (workspaceId: string, messageId: string) =>
    apiClient.delete(`/workspaces/${workspaceId}/chat/${messageId}`),
};

export const usageApi = {
  getMe: () => apiClient.get("/usage/me"),
};

export const notificationApi = {
  getAll: (page = 1, limit = 15, unreadOnly = false) =>
    apiClient.get(`/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`),
  markAsRead: (id: string) => apiClient.put(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.put("/notifications/read-all"),
  delete: (id: string) => apiClient.delete(`/notifications/${id}`),
};

export const activityLogApi = {
  getAll: (page = 1, limit = 20, workspaceId?: string | null, action?: string) => {
    let url = `/activity-logs?page=${page}&limit=${limit}`;
    if (workspaceId) url += `&workspaceId=${workspaceId}`;
    if (action) url += `&action=${action}`;
    return apiClient.get(url);
  },
};

export default apiClient;
