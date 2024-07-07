import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import generateAccessAndRefreshToken from "../utils/generateAccessAndRefreshToke.js";
import { cookieOptions } from "../constants/index.js";
import UserModel from "../models/UserModel.js";

const getAuthUser = asyncHandler(async (req, res) => {
  if (!req.userId)
    throw new ApiError(400, "User ID not found in request body");

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(req.userId);

  const user = await UserModel.findById(req.userId).select("-password -refreshToken -forgotPasswordToken -forgotPasswordTokenExpiry -verifyToken -verifyTokenExpiry -passwordResetOTP");

  user.refreshToken = refreshToken;
  await user.save();

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, {
      accessToken,
      user,
    }, "Authorized User fetched"));
});

export { getAuthUser };
