<div align="center">
  <img src="https://img.icons8.com/color/120/000000/artificial-intelligence.png" alt="SmartDoc AI Logo"/>
  <h1>🤖 SmartDoc AI</h1>
  <p><strong>Nền tảng Quản lý và Tương tác Tài liệu thông minh bằng Trí tuệ Nhân tạo (RAG)</strong></p>

  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas_Vector_Search-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
  [![Gemini](https://img.shields.io/badge/Google-Gemini_AI-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
  [![Supabase](https://img.shields.io/badge/Supabase-Storage-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
</div>

<br/>

## 🌟 Giới thiệu chung
**SmartDoc AI** là một giải pháp đột phá giúp cá nhân và doanh nghiệp tối ưu hóa việc phân tích và tìm kiếm thông tin từ kho tài liệu khổng lồ. Bằng việc ứng dụng công nghệ **RAG (Retrieval-Augmented Generation)** kết hợp với sức mạnh của **Google Gemini AI**, SmartDoc AI biến những tập tin PDF, Word tĩnh lặng thành một trợ lý ảo am hiểu tường tận mọi kiến thức trong tài liệu của bạn.

Thay vì phải đọc thủ công hàng trăm trang giấy, bạn chỉ cần tải tài liệu lên và đặt câu hỏi. AI sẽ đọc, tổng hợp và trả lời bạn ngay lập tức, kèm theo **trích dẫn nguồn chính xác đến từng số trang**.

## ✨ Tính năng nổi bật

- 📁 **Quản lý Không gian làm việc (Workspaces):** Tổ chức tài liệu cá nhân hoặc tạo các không gian làm việc chung (Workspaces) để chia sẻ tài liệu và hợp tác cùng đồng nghiệp.
- 🤖 **Chatbot AI Thông Minh (RAG):** Đặt câu hỏi và nhận câu trả lời tức thì dựa trên nội dung của hàng chục tài liệu cùng lúc.
- 🎯 **Trích dẫn thông minh (Smart Citation):** AI luôn đưa ra nguồn trích dẫn. Click vào nhãn trích dẫn, hệ thống tự động mở file PDF và **cuộn thẳng đến đúng trang** chứa thông tin đó!
- 🔍 **Trích xuất dữ liệu (OCR Background Jobs):** Tích hợp BullMQ & Redis để xử lý và bóc tách văn bản từ ảnh/PDF scan một cách mượt mà dưới nền (Background jobs).
- 📊 **User Quota Dashboard:** Mỗi người dùng có bảng điều khiển thống kê tài nguyên (số file, dung lượng MB) và biểu đồ trực quan (Recharts) theo dõi lượng Token AI đã tiêu thụ trong 7 ngày.
- ⚙️ **Admin Control Panel:** Bảng điều khiển dành riêng cho Admin để giám sát logs hệ thống, quản lý người dùng và theo dõi hiệu suất.

## 💻 Công nghệ sử dụng (Tech Stack)

### 🎨 Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Components/Icons:** Lucide React, Framer Motion (Animations), Recharts (Biểu đồ)
- **Markdown Rendering:** React Markdown & Remark-GFM

### 🛠 Backend
- **Core:** Node.js, Express.js (ES Modules)
- **Architecture:** Controller - Service - Model Pattern
- **AI/LLM:** LangChain, Google Generative AI (Gemini 1.5 Pro / Flash / Embeddings)
- **Background Jobs:** BullMQ, Redis

### 🗄 Database & Storage
- **Database:** MongoDB Atlas (tích hợp Atlas Vector Search để lưu trữ Vector Embeddings)
- **File Storage:** Supabase Storage (lưu trữ tệp tin an toàn)

---

## 🚀 Hướng dẫn cài đặt (Local Development)

### 1. Yêu cầu hệ thống (Prerequisites)
- [Node.js](https://nodejs.org/en/) (phiên bản v18 trở lên)
- [Redis Server](https://redis.io/) (yêu cầu để chạy Background Jobs)
- Tài khoản [MongoDB Atlas](https://www.mongodb.com/) (Tạo Cluster và cấu hình Vector Search Index)
- Tài khoản [Supabase](https://supabase.com/) (Tạo project mới và lấy cấu hình Storage)
- API Key của [Google Gemini](https://aistudio.google.com/)

### 2. Cài đặt các gói phụ thuộc (Install Dependencies)

Bạn cần mở 2 cửa sổ terminal riêng biệt.

**Cửa sổ 1 (Backend):**
```bash
cd backend
npm install
```

**Cửa sổ 2 (Frontend):**
```bash
cd frontend
npm install
```

### 3. Cấu hình biến môi trường (.env)

Tạo file `.env` trong thư mục `backend/` theo mẫu sau:

```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_DB_NAME=smartdoc
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority

# Security JWT
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key

# Supabase Storage
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_API_KEY=<your-anon-or-service-key>
SUPABASE_BUCKET=documents

# Google AI (Gemini)
GOOGLE_API_KEY=<your-google-ai-studio-key>

# Redis (Cho OCR BullMQ)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

### 4. Cấu hình MongoDB Atlas Vector Search Index
Để tính năng RAG hoạt động, bạn **bắt buộc** phải tạo Vector Search Index trên MongoDB Atlas.
1. Vào MongoDB Atlas -> Database -> Chọn Collection `documents`
2. Chọn tab **Atlas Search** -> **Create Search Index** -> **JSON Editor**
3. Đặt tên index là `vector_index` và dán cấu hình sau:
```json
{
  "fields": [
    {
      "numDimensions": 768,
      "path": "embedding",
      "similarity": "cosine",
      "type": "vector"
    }
  ]
}
```

### 5. Khởi chạy dự án

Đảm bảo **Redis Server** đang chạy trên máy tính của bạn trước khi khởi động Backend.

**Chạy Backend (Cửa sổ 1):**
```bash
cd backend
npm run dev
```

**Chạy Frontend (Cửa sổ 2):**
```bash
cd frontend
npm run dev
```

Trang web sẽ hoạt động tại địa chỉ: `http://localhost:3000`

---

## 📂 Cấu trúc thư mục (Folder Structure)

```text
smartdoc_ai/
├── backend/
│   ├── src/
│   │   ├── config/         # Cấu hình DB, Supabase, Redis
│   │   ├── controllers/    # Xử lý logic Request/Response
│   │   ├── middlewares/    # Phân quyền, JWT, Rate Limiting
│   │   ├── models/         # MongoDB Mongoose Schemas
│   │   ├── routes/         # Định tuyến API
│   │   ├── services/       # Xử lý nghiệp vụ lõi (Chat RAG, OCR, Documents)
│   │   ├── utils/          # Các hàm hỗ trợ dùng chung
│   │   ├── validations/    # Zod schemas để kiểm tra đầu vào
│   │   └── app.js          # Khởi tạo Express App
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router (Pages & Layouts)
│   │   ├── components/     # React Components dùng chung (Sidebar, Chat, Modal...)
│   │   ├── hooks/          # Custom React Hooks
│   │   ├── lib/            # Tiện ích (Tailwind utils)
│   │   └── services/       # Axios API Clients
│   ├── tailwind.config.ts  # Cấu hình TailwindCSS
│   └── package.json
└── README.md
```

## 🤝 Tác giả (Author)
Dự án được nghiên cứu và phát triển bởi **Ngô Xuân Cường** và đội ngũ phát triển.
Nếu bạn có bất kỳ câu hỏi nào, vui lòng mở **Issue** trên Repository này.

---
*⭐ Nếu bạn thấy dự án này hữu ích, đừng quên cho một Star trên GitHub nhé!*
