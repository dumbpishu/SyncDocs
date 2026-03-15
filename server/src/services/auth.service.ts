import { User } from "../models/user.model";
import { OTP } from "../models/otp.model";
import { Document } from "../models/document.model";
import { generateOtp } from "../utils/generateOtp";
import { sendEmail } from "./email.service";
import { otpEmailTemplate } from "../utils/emailTemplates";
import { createUniqueUsername } from "../utils/generateUsername";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/appError";
import { uploadImageToCloudinary } from "./cloudinary.service";

const OTP_EXPIRY_IN_MS = 5 * 60 * 1000;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const issueSessionTokens = async (userId: string) => {
    const accessToken = generateAccessToken(userId);
    const refreshToken = await generateRefreshToken(userId);

    return { accessToken, refreshToken };
};

export const sendOtpService = async (email: string) => {
    const normalizedEmail = normalizeEmail(email);
    const existingOtp = await OTP.findOne({ email: normalizedEmail });

    if (existingOtp && existingOtp.expiresAt > new Date()) {
        throw new AppError(429, "OTP already sent. Please wait before requesting a new one.");
    }

    const { otp, hashedOtp } = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_IN_MS);

    await OTP.findOneAndUpdate(
        { email: normalizedEmail },
        { otp: hashedOtp, expiresAt },
        { upsert: true, new: true }
    );

    await sendEmail(normalizedEmail, "Your OTP for SyncDocs", otpEmailTemplate(otp));
}

export const verifyOtpService = async (email: string, otp: string) => {
    const normalizedEmail = normalizeEmail(email);
    const otpRecord = await OTP.findOne({ email: normalizedEmail });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
        throw new AppError(400, "OTP has expired or does not exist.");
    }

    const isValidOtp = await bcrypt.compare(otp, otpRecord.otp);

    if (!isValidOtp) {
        throw new AppError(400, "Invalid OTP.");
    }

    await OTP.deleteOne({ email: normalizedEmail });

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
        const username = await createUniqueUsername();
        user = new User({ email: normalizedEmail, username, isVerified: true });
        await user.save();
    }

    const tokens = await issueSessionTokens(user._id.toString());

    return { user, ...tokens };
}

export const getCurrentUserService = async (userId: string) => {
    const user = await User.findById(userId).select("-__v");
    if (!user) {
        throw new AppError(404, "User not found.");
    }
    return user;
}

export const refreshSessionService = async (refreshToken: string) => {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { id: string };

    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || !user.refreshToken) {
        throw new AppError(401, "Unauthorized");
    }

    const isValidRefreshToken = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!isValidRefreshToken) {
        throw new AppError(401, "Unauthorized");
    }

    const tokens = await issueSessionTokens(user._id.toString());

    return {
        user,
        ...tokens,
    };
}

export const updateCurrentUserService = async (
    userId: string,
    data: {
        fullName?: string;
        username?: string;
        avatar?: string;
    }
) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(404, "User not found.");
    }

    if (data.username !== undefined) {
        const normalizedUsername = data.username.trim().toLowerCase();
        const existingUser = await User.findOne({ username: normalizedUsername, _id: { $ne: userId } });

        if (existingUser) {
            throw new AppError(409, "Username is already taken.");
        }

        user.username = normalizedUsername;
    }

    if (data.fullName !== undefined) {
        user.fullName = data.fullName.trim();
    }

    if (data.avatar !== undefined) {
        user.avatar = data.avatar.trim();
    }

    await user.save();

    return User.findById(userId).select("-__v").orFail();
}

export const deleteCurrentUserService = async (userId: string) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(404, "User not found.");
    }

    await Promise.all([
        Document.updateMany(
            { owner: userId, isDeleted: false },
            { isDeleted: true }
        ),
        Document.updateMany(
            { "collaborators.user": userId },
            { $pull: { collaborators: { user: userId } }, $inc: { version: 1 } }
        ),
        OTP.deleteMany({ email: user.email }),
        User.findByIdAndDelete(userId)
    ]);

    return user;
}

export const uploadCurrentUserAvatarService = async (userId: string, imageData: string) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(404, "User not found.");
    }

    const avatarUrl = await uploadImageToCloudinary(imageData, "syncdocs/avatars");
    user.avatar = avatarUrl;
    await user.save();

    return User.findById(userId).select("-__v").orFail();
}

export const logoutCurrentUserService = async (userId: string) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(404, "User not found.");
    }

    user.refreshToken = undefined;
    await user.save();
}
