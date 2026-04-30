import supabase from "../config/supabase.js";

const storageService = {
  uploadDocument: async (file) => {
    try {
      const fileExt = file.originalname.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // Tải file lên Supabase Storage
      const { data, error } = await supabase.storage
        .from("documents") // ĐẢM BẢO BẠN ĐÃ TẠO BUCKET TÊN 'documents'
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        console.error("Supabase Error Details:", error);
        throw new Error("Supabase Upload Error: " + error.message);
      }

      // Lấy URL công khai của file
      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath);

      return {
        fileUrl: publicUrl,
        cloudFileId: data.path,
      };
    } catch (error) {
      console.error("Upload Catch Error:", error);
      throw error;
    }
  },

  deleteDocument: async (cloudFileId) => {
    const { data, error } = await supabase.storage
      .from("documents")
      .remove([cloudFileId]);

    if (error) throw new Error("Lỗi xóa file trên Supabase: " + error.message);

    return data;
  },
};

export default storageService;
