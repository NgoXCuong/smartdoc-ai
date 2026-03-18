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

export const changePasswordSchema = z
  .object({
    oldPassword: z
      .string()
      .min(6, "Password phải có ít nhất 6 ký tự")
      .max(100, "Password không được vượt quá 100 ký tự"),
    newPassword: z
      .string()
      .min(6, "Password mới phải có ít nhất 6 ký tự")
      .max(100, "Password mới không được vượt quá 100 ký tự"),
    confirmPassword: z
      .string()
      .min(6, "Xác nhận password phải có ít nhất 6 ký tự"),
  })
  // 1. Kiểm tra mật khẩu mới không được trùng với mật khẩu cũ
  .refine((data) => data.newPassword !== data.oldPassword, {
    message: "Mật khẩu mới không được giống mật khẩu hiện tại",
    path: ["newPassword"], // Báo lỗi ở field newPassword
  })
  // 2. Kiểm tra mật khẩu xác nhận phải khớp với mật khẩu mới
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"], // Báo lỗi ở field confirmPassword
  });

export const checkEmailForgotPassSchema = z.object({
  email: z
    .string({ required_error: "Email là bắt buộc" })
    .trim()
    .min(1, "Vui lòng nhập email")
    .email("Định dạnh email không hợp lệ"),
});

export const resetPasswordSchema = z
  .object({
    // Mật khẩu mới với các ràng buộc khắt khe (Strong Password)
    password: z
      .string({ required_error: "Mật khẩu là bắt buộc" })
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .max(100, "Mật khẩu không được vượt quá 100 ký tự")
      .regex(/[A-Z]/, "Mật khẩu phải chứa ít nhất 1 chữ cái in hoa")
      .regex(/[a-z]/, "Mật khẩu phải chứa ít nhất 1 chữ cái thường")
      .regex(/[0-9]/, "Mật khẩu phải chứa ít nhất 1 chữ số")
      .regex(/[\W_]/, "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt"), // \W là ký tự không phải chữ/số, _ là dấu gạch dưới

    // Trường xác nhận mật khẩu
    confirmPassword: z
      .string({ required_error: "Vui lòng xác nhận mật khẩu" })
      .min(1, "Vui lòng xác nhận mật khẩu"),
  })
  // Kiểm tra mật khẩu xác nhận phải khớp với mật khẩu mới
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });
