import { Request, Response } from "express";
import { sendOtpService, verifyOtpService } from "../services/auth.service";

export const sendOtp = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        await sendOtpService(email);

        return res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Failed to send OTP" });
    }
}

export const verifyOtp = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;

        const { user, accessToken, refreshToken } = await verifyOtpService(email, otp);

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 15 * 60 * 1000, 
        })

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000, 
        })

        return res.status(200).json({ message: "OTP verify successfully", user, accessToken, refreshToken });
    } catch (error) {
        return res.status(500).json({ message: "Failed to verify OTP" });
    }
}