import supabase from "../config/supabase.js";

const storageService = {
  uploadDocument: async (file) => {
    const fileExt = file.originalname.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { data, error } = await supabase.storage
      .from("documents")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) throw new Error("Supabase Upload Error: " + error.message);

    const {
      data: { publicUrl },
    } = supabase.storage.from("documents").getPublicUrl(filePath);

    return {
      fileUrl: publicUrl,
      cloudFileId: data.path,
    };
  },

  deleteDocument: async (cloudFileId) => {
    const { data, error } = await supabase.storage
      .from("documents")
      .remove([cloudFileId.replace("documents/", "")]);

    if (error) throw new Error("Lỗi xóa file trên Supabase: ", error.message);

    return data;
  },
};

export default storageService;
