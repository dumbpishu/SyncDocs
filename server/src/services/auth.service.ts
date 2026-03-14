import { User } from "../models/user.model";
import { OTP } from "../models/otp.model";
import { generateOtp } from "../utils/generateOtp";
import { sendEmail } from "./email.service";
import { otpEmailTemplate } from "../utils/emailTemplates";
import { createUniqueUsername } from "../utils/generateUsername";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken";
import bcrypt from "bcryptjs";

export const sendOtpService = async (email: string) => {
    const existingOtp = await OTP.findOne({ email });

    if (existingOtp && existingOtp.expiresAt > new Date()) {
        throw new Error("OTP already sent. Please wait before requesting a new one.");
    }

    const { otp, hashedOtp } = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); 

    await OTP.findOneAndUpdate(
        { email },
        { otp: hashedOtp, expiresAt },
        { upsert: true, new: true }
    );

    await sendEmail(email, "Your OTP for SyncDocs", otpEmailTemplate(otp));
}

export const verifyOtpService = async (email: string, otp: string) => {
    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
        throw new Error("OTP has expired or does not exist.");
    }

    const isValidOtp = await bcrypt.compare(otp, otpRecord.otp);

    if (!isValidOtp) {
        throw new Error("Invalid OTP.");
    }

    await OTP.deleteOne({ email });

    let user = await User.findOne({ email });

    if (!user) {
        const username = await createUniqueUsername();
        user = new User({ email, username, isVerified: true });
        await user.save();
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    return { user, accessToken, refreshToken };
}

export const getCurrentUserService = async (userId: string) => {
    const user = await User.findById(userId).select("-__v");
    if (!user) {
        throw new Error("User not found.");
    }
    return user;
}