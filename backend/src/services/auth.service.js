import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../models/user.model.js";
import logger from "../utils/logger.js";

const authService = {
  register: async (username, email, password) => {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("Email đã tồn tại");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verifyToken = crypto.randomBytes(32).toString("hex");
    const hashedVerifyToken = crypto
      .createHash("sha256")
      .update(verifyToken)
      .digest("hex");

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      isEmailVerified: false,
      verificationToken: hashedVerifyToken,
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
    });

    // 3. Gửi email xác thực
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const verifyUrl = `${process.env.FRONTEND_URL}/api/auth/verify-email/${verifyToken}`;

    const mailOptions = {
      from: `"Smart Document AI Support" <${process.env.EMAIL_USER}>`,
      to: newUser.email,
      subject: "Xác thực địa chỉ email của bạn",
      html: `
        <h3>Xin chào ${newUser.username},</h3>
        <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng click vào nút bên dưới để xác thực địa chỉ email của bạn:</p>
        <a href="${verifyUrl}" target="_blank" style="display:inline-block; padding:10px 20px; color:white; background-color:green; text-decoration:none; border-radius:5px;">
          <b>Xác thực Email</b>
        </a>
        <p><i>Lưu ý: Link này sẽ hết hạn sau 24 giờ.</i></p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      // Dù gửi mail lỗi thì user vẫn được tạo, nhưng ta nên log ra để kiểm tra
      logger.error("Lỗi gửi email xác thực:", error);
    }

    // Trả về kèm thông báo để Frontend hiện popup nhắc check mail
    return {
      user: newUser,
      message:
        "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
    };
  },

  login: async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Email không tồn tại");
    }

    if (!user.isEmailVerified) {
      throw new Error("Vui lòng xác thực email trước khi đăng nhập");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Mật khẩu không đúng");
    }

    const payload = {
      userId: user._id,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });

    if (!user.refreshTokens) {
      user.refreshTokens = [];
    }
    user.refreshTokens.push(refreshToken);
    await user.save();

    return { user, accessToken, refreshToken };
  },

  refreshToken: async (token) => {
    if (!token) {
      throw new Error("Token không hợp lệ");
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    // Token Reuse Detection: Nếu token không có trong mảng (đã bị dùng hoặc không tồn tại)
    if (!user.refreshTokens.includes(token)) {
      user.refreshTokens = []; // Thu hồi toàn bộ token an toàn
      await user.save();
      throw new Error("Token không hợp lệ hoặc đã bị tái sử dụng");
    }

    const payload = {
      userId: user._id,
      role: user.role,
    };

    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const newRefreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });

    user.refreshTokens = user.refreshTokens.filter((rt) => rt !== token);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    return {
      accessToken: newAccessToken,
      newRefreshToken,
    };
  },

  logout: async (userId, tokenToRemove) => {
    const user = await User.findById(userId);
    if (user) {
      if (tokenToRemove) {
        // Chỉ xóa token của thiết bị hiện tại
        user.refreshTokens = user.refreshTokens.filter(
          (rt) => rt !== tokenToRemove,
        );
      } else {
        // Xóa hết toàn hộ token của màn hình
        user.refreshTokens = [];
      }
      await user.save();
    }
    return { message: "Đăng xuất thành công" };
  },

  getProfile: async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    return user;
  },

  changePassword: async (userId, oldPassword, newPassword) => {
    const user = await User.findById(userId);

    if (!user) throw new Error("Người dùng không tồn tại");

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new Error("Mật khẩu cũ không chính xác");

    const duplicatePassword = await bcrypt.compare(newPassword, user.password);
    if (duplicatePassword)
      throw new Error("Mật khẩu mới không được trùng với mật khẩu cũ");

    const salt = await bcrypt.genSalt(10);
    const hashNewPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashNewPassword;
    user.refreshTokens = []; // Đăng xuất tất cả thiết bị khi đổi mật khẩu

    await user.save();
    return { message: "Đổi mật khẩu thành công" };
  },

  forgotPassword: async (email) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error("Không tìm thấy người dùng");

    // 2. Tạo mã token ngẫu nhiên bằng crypto
    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // 3. Lưu mã đã Băm (Hashed) và set thời hạn vào DB
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 phút

    await user.save({ validateBeforeSave: false });

    // 4. Cấu hình Nodemailer và gửi thư
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Lưu ý: Nếu dùng Gmail, đây phải là "Mật khẩu ứng dụng" (App Password)
      },
    });

    // Tạo URL dẫn tới Frontend
    const resetUrl = `${process.env.FRONTEND_URL}/api/auth/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Smart Document AI Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Yêu cầu đặt lại mật khẩu",
      html: `
      <h3>Xin chào ${user.username || "bạn"},</h3>
      <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
      <p>Vui lòng click vào đường dẫn bên dưới để thiết lập mật khẩu mới:</p>
      <a href="${resetUrl}" target="_blank" style="display:inline-block; padding:10px 20px; color:white; background-color:blue; text-decoration:none; border-radius:5px;">
        <b>Đặt lại mật khẩu</b>
      </a>
      <p><i>Lưu ý: Đường dẫn này sẽ hết hạn sau 15 phút.</i></p>
      <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.</p>
    `,
    };

    try {
      // Thực hiện gửi mail
      await transporter.sendMail(mailOptions);
      return { message: "Email khôi phục mật khẩu đã được gửi thành công" };
    } catch (error) {
      // Nếu gửi mail lỗi (VD: sai cấu hình), cần rollback (xóa) token trong DB
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });

      throw new Error("Có lỗi xảy ra khi gửi email. Vui lòng thử lại sau.");
    }
  },

  resetPassword: async (token, newPassword) => {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) throw new Error("Token không hợp lệ hoặc hết hạn");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    user.refreshTokens = [];

    await user.save();
    return { message: "Đặt lại mất khẩu thành công. Vui lòng đăng nhập lại." };
  },

  verifyEmail: async (token) => {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) throw new Error("Không tìm thấy người dùng");

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    await user.save();

    return {
      message: "Xác thực email thành công. Bây giờ bạn có thể đăng nhập!",
    };
  },
};

export default authService;
