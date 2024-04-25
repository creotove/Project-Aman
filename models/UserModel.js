import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  phoneNumber: {
    type: Number,
    required: [true, "Phone number is required"],
    index: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ["ADMIN", "CM", "TAILOR", "HELPER", "CUSTOMER"],
    required: [true, "Role is required"],
  },
  avatar: {
    type: String,
    default: "https://www.w3schools.com/howto/img_avatar.png",
  },
  refreshToken: {
    type: String,
  },
  forgotPasswordToken: {
    type: String,
  },
  forgotPasswordTokenExpiry: {
    type: Date,
  },
  verifyToken: {
    type: String,
  },
  verifyTokenExpiry: {
    type: Date,
  },
  passwordResetOTP: {
    type: Number,
  },
});

const UserModel = mongoose.model("user", userSchema);
export default UserModel;
