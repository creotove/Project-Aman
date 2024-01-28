import UserModel from "../models/UserModel.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const auth = asyncHandler(async (req, _, next) => {
  const token = await req.header("Authorization")?.replace("Bearer ", "");
  console.log(token);

  if (!token) {
    throw new ApiError(401, "Token not found in request header");
  }

  const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

  if (!decodedToken) {
    throw new ApiError(401, "Unauthorized to access this route");
  }

  const user = await UserModel.findById(decodedToken._id).select(
    "-password -__v -createdAt -updatedAt -refreshToken"
  );

  if (!user) {
    throw new ApiError(401, "User not found based on token");
  }

  req.user = user;
  next();
});
