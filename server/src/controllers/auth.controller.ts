import { Request, Response } from "express";
import { getCurrentUserService, refreshSessionService, sendOtpService, verifyOtpService } from "../services/auth.service";
import { clearSessionCookies, setSessionCookies } from "../utils/authCookies";
import { getErrorResponse } from "../utils/controller";
import { sendErrorResponse, sendSuccessResponse } from "../utils/apiResponse";

export const sendOtp = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        await sendOtpService(email);

        return sendSuccessResponse(res, {
            message: "OTP sent successfully"
        });
    } catch (error) {
        const { statusCode, message, errors } = getErrorResponse(error, "Failed to send OTP");
        return sendErrorResponse(res, { statusCode, message, errors });
    }
};

export const verifyOtp = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;

        const { user, accessToken, refreshToken } = await verifyOtpService(email, otp);

        setSessionCookies(res, accessToken, refreshToken);

        return sendSuccessResponse(res, {
            message: "OTP verified successfully",
            data: {
                user,
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        const { statusCode, message, errors } = getErrorResponse(error, "Failed to verify OTP");
        return sendErrorResponse(res, { statusCode, message, errors });
    }
};

export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return sendErrorResponse(res, {
                statusCode: 400,
                message: "User ID is missing"
            });
        }

        const user = await getCurrentUserService(userId);

        return sendSuccessResponse(res, {
            message: "Current user fetched successfully",
            data: { user }
        });
    } catch (error) {
        const { statusCode, message, errors } = getErrorResponse(error, "Failed to get current user");
        return sendErrorResponse(res, { statusCode, message, errors });
    }
};

export const refreshSession = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return sendErrorResponse(res, {
                statusCode: 401,
                message: "Unauthorized"
            });
        }

        const { user, accessToken, refreshToken: nextRefreshToken } = await refreshSessionService(refreshToken);

        setSessionCookies(res, accessToken, nextRefreshToken);

        return sendSuccessResponse(res, {
            message: "Session refreshed successfully",
            data: {
                user,
                accessToken,
                refreshToken: nextRefreshToken
            }
        });
    } catch (error) {
        clearSessionCookies(res);

        const { statusCode, message, errors } = getErrorResponse(error, "Unauthorized");
        return sendErrorResponse(res, { statusCode, message, errors });
    }
};
