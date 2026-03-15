import { api } from "../services/axios";
import type { ApiSuccessResponse } from "../types/api";
import type { AuthUserResponse, User } from "../types/auth";
import { unwrapApiResponse } from "../utils/api";

export const sendOtp = async (email: string) => {
    const res = await api.post<ApiSuccessResponse<null>>("/auth/send-otp", { email });
    return res.data;
};

export const verifyOtp = async (email: string, otp: string) => {
    const res = await api.post<ApiSuccessResponse<{ user: User; accessToken: string; refreshToken: string }>>("/auth/verify-otp", { email, otp });
    return unwrapApiResponse(res.data);
};

export const getCurrentUser = async () => {
    const res = await api.get<ApiSuccessResponse<AuthUserResponse>>("/auth/me");
    return unwrapApiResponse(res.data);
};

export const refreshSession = async () => {
    const res = await api.post<ApiSuccessResponse<{ user: User; accessToken: string; refreshToken: string }>>("/auth/refresh", undefined, {
        skipAuthRefresh: true,
    });
    return unwrapApiResponse(res.data);
};
