import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"
export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "")

        if (!token) {
            throw new ApiError(401, "unothorized request")

        }

        const decodedToken = jwt.verify(token.proccess.env.ACCESS_TOKEN_SECRET)
        await User.findById(decodedToken?._id).
            select("-password -refreshToken")

        if (!User) {

            throw new ApiError(401, "invalid access token");

        }
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error.message || "invalid access token")
    }
})