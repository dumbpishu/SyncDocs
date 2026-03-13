import { User } from "../models/user.model";
import { OTP } from "../models/otp.model";
import { Request, Response } from "express";
import { generateOtp } from "../utils/generateOtp";
import bcrypt from "bcryptjs";
import { sendEmail } from "../services/email.service";
import { otpEmailTemplate } from "../utils/emailTemplates";

export const sendOtp = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        const existingOtp = await OTP.findOne({ email });

        if (existingOtp && existingOtp.expiresAt > new Date()) {
            return res.status(429).json({ message: "OTP already sent. Please wait before requesting a new one." });
        }

        const otp = generateOtp();
        const hashedOtp = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 2 * 60 * 1000); 

        await OTP.findOneAndUpdate(
            { email },
            { otp: hashedOtp, expiresAt },
            { upsert: true, new: true }
        );

        await sendEmail(email, "Your OTP for SyncDocs", otpEmailTemplate(otp));

        return res.status(200).json({ message: "OTP sent successfully." });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}