import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model";

export const generateAccessToken = (userId: string) => {
    return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET!, { expiresIn: "15m", algorithm: "HS256" });
}

export const generateRefreshToken = (userId: string) => {
    const token = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET!, { expiresIn: "7d", algorithm: "HS256" });

    const hashedToken = bcrypt.hashSync(token, 10);

    User.findByIdAndUpdate(userId, { refreshToken: hashedToken }, { new: true }).exec();

    return token;
}