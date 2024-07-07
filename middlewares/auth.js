import UserModel from "../models/UserModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const auth = asyncHandler(async (req, res, next) => {
  const token =
    req?.cookies?.refreshToken ||
    req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Token not found in request header");
  }

  const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log("Error in token verification:", err);
      res.status(401).
        clearCookie("refreshToken").
        clearCookie("accessToken").
        json(new ApiResponse(401, null, "Token expired or invalid"));

    } else {
      return decoded;
    }
  });

  console.log("Decoded token:", decodedToken._id);
  req.userId = decodedToken._id;
  next();
});
