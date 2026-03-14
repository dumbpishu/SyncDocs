import { Request, Response } from "express";
import { getCurrentUserService, refreshSessionService, sendOtpService, verifyOtpService } from "../services/auth.service";

const getCookieOptions = (maxAge: number) => ({
    path: "/",
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" as const : "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge,
});

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

        res.cookie("accessToken", accessToken, getCookieOptions(15 * 60 * 1000));
        res.cookie("refreshToken", refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

        return res.status(200).json({ message: "OTP verify successfully", user, accessToken, refreshToken });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to verify OTP";
        return res.status(400).json({ message });
    }
}

export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(400).json({ message: "User ID is missing" });
        }

        const user = await getCurrentUserService(userId);

        return res.status(200).json({ user });
    } catch (error) {
        return res.status(500).json({ message: "Failed to get current user" });
    }
}

export const refreshSession = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { user, accessToken, refreshToken: nextRefreshToken } = await refreshSessionService(refreshToken);

        res.cookie("accessToken", accessToken, getCookieOptions(15 * 60 * 1000));
        res.cookie("refreshToken", nextRefreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

        return res.status(200).json({
            message: "Session refreshed successfully",
            user,
            accessToken,
            refreshToken: nextRefreshToken,
        });
    } catch (error) {
        res.clearCookie("accessToken", getCookieOptions(0));
        res.clearCookie("refreshToken", getCookieOptions(0));

        const message = error instanceof Error ? error.message : "Unauthorized";
        return res.status(401).json({ message });
    }
}
