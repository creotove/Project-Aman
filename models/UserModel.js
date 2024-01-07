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
  },
  role: {
    type: String,
    enum: ["ADMIN", "CUTTING MASTER", "TAILOR", "HELPER", "CUSTOMER"],
    required: [true, "Role is required"],
  },
  avatar: {
    type: String,
    required: [true, "Pic is required"],
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
});

const UserModel = mongoose.model("user", userSchema);
export default UserModel;
