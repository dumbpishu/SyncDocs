import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

export const generateAccessToken = (userId: string) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_ACCESS_SECRET!,
        { expiresIn: ACCESS_TOKEN_EXPIRY, algorithm: "HS256" }
    );
};

export const generateRefreshToken = async (userId: string) => {
    const token = jwt.sign(
        { id: userId },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: REFRESH_TOKEN_EXPIRY, algorithm: "HS256" }
    );

    const hashedToken = await bcrypt.hash(token, 10);

    await User.findByIdAndUpdate(userId, { refreshToken: hashedToken }, { new: true }).exec();

    return token;
};
