import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(2, "Username phải có ít nhất 2 ký tự")
    .max(30, "Username không được vượt quá 30 ký tự"),

  email: z.string().email("Email không hợp lệ"),

  password: z
    .string()
    .min(6, "Password phải có ít nhất 6 ký tự")
    .max(100, "Password không được vượt quá 100 ký tự"),
});

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});
