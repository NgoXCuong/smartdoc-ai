import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isActive: { type: Boolean, default: true },
    refreshTokens: [{ type: String }],

    // Quên mật khâu và reset
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // Verify Email
    isEmailVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },
  },
  { timestamps: true },
);

// Ẩn các trường nhạy cảm khi trả về dữ liệu người dùng
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.refreshTokens;
  delete user.__v;
  return user;
};

const User = mongoose.model("user", userSchema);

export default User;
