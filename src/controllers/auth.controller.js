import bcryptjs from "bcryptjs";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import UserModel from "../models/UserModel.js";
import {cookieOptions} from "../constants/index.js";
import {generateOTP, sendOTPEmail} from "../utils/passwordResetMail.js";
import generateAccessAndRefreshToken from "../utils/generateAccessAndRefreshToke.js";
export const validateOTP = asyncHandler(async (req, res) => {
  const {password, otp} = req.body;
  const admin = await UserModel.findOne({role: "ADMIN"});
  if (admin.passwordResetOTP !== parseInt(otp)) throw new ApiError(400, "Invalid OTP");
  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(password, salt);
  admin.password = hashedPassword;
  admin.passwordResetOTP = null;
  await admin.save();
  return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

export const sendOTP = asyncHandler(async (req, res) => {
  const otp = generateOTP();
  const sent = await sendOTPEmail(process.env.EMAIL, otp);
  const admin = await UserModel.findOne({role: "ADMIN"});
  if (!admin) throw new ApiError(404, "Admin not found");
  admin.passwordResetOTP = otp;
  await admin.save();
  if (!sent) return res.status(200).json(new ApiResponse(200, {otp}, "OTP sent successfully"));
  else return res.status(400).json(new ApiResponse(400, {}, "OTP sending failed"));
});

export const login = asyncHandler(async (req, res) => {
  const {phoneNumber, password} = req.body;
  if (!phoneNumber) throw new ApiError(400, "Phone number is required");
  if (!password) throw new ApiError(400, "Password is required");

  const user = await UserModel.findOne({phoneNumber, role: "ADMIN"});
  if (!user) throw new ApiError(404, "User not found");

  const isMatch = await bcryptjs.compare(password, user.password);
  if (!isMatch) throw new ApiError(406, "Invalid credentials");

  const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

  const loggedInUser = await UserModel.findById(user._id).select("-password -refreshToken -forgotPasswordToken -forgotPasswordTokenExpiry -verifyToken -verifyTokenExpiry -__v");

  loggedInUser.refreshToken = refreshToken;
  await loggedInUser.save();
  return res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, {
        accessToken,
        user: loggedInUser,
      })
    );
});

export const logout = asyncHandler(async (req, res) => {
  await UserModel.findByIdAndUpdate(
    req.userId,
    {
      refreshToken: null,
    },
    {new: true}
  );
  return res.status(200).clearCookie("refreshToken").clearCookie("accessToken").json(new ApiResponse(200, {}, "Logged out successfully"));
});

export const getAuthUser = asyncHandler(async (req, res) => {
  if (!req.userId) throw new ApiError(400, "User ID not found in request body");

  const {accessToken, refreshToken} = await generateAccessAndRefreshToken(req.userId);

  const user = await UserModel.findById(req.userId).select("-password -refreshToken -forgotPasswordToken -forgotPasswordTokenExpiry -verifyToken -verifyTokenExpiry -passwordResetOTP");

  user.refreshToken = refreshToken;
  await user.save();

  return res.status(200).cookie("refreshToken", refreshToken, cookieOptions).json(
    new ApiResponse(
      200,
      {
        accessToken,
        user,
      },
      "Authorized User fetched"
    )
  );
});

export const changePassword = asyncHandler(async (req, res) => {
  const {oldPassword, newPassword} = req.body;
  const userId = req.user._id;

  const user = await UserModel.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const isMatch = await bcryptjs.compare(oldPassword, user.password);
  if (!isMatch) throw new ApiError(400, "Password is invalid");

  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(newPassword.toString(), salt);
  user.password = hashedPassword;
  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});
