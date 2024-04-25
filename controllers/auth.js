import UserModel from "../models/UserModel.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getAuthUser = asyncHandler(async (req, res) => {
  if (!req.user._id)
    throw new ApiError(400, "User ID not found in request body");
  const user = await UserModel.findById(req.user._id).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "Authorized User fetched"));
});

export { getAuthUser };
