import UserModel from "../models/UserModel.js";
import { ApiError } from "./ApiError.js";
import jwt from "jsonwebtoken";


async function generateAccessAndRefreshToken(userId) {
    try {
        const user = await UserModel.findById(userId);
        if (!user)
            throw new ApiError(404, "User not found in access and refresh token");

        const accessToken = jwt.sign(
            {
                _id: user._id,
                role: user.role,
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: "10m",
            }
        );

        const refreshToken = jwt.sign(
            {
                _id: user._id,
                role: user.role,
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: "1d",
            }
        );

        user.refreshToken = refreshToken;
        await user.save();
        return { accessToken, refreshToken };
    } catch (error) {
        console.error("Error in generating tokens:", error);
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
}

export default generateAccessAndRefreshToken;