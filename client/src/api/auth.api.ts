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

export const updateCurrentUser = async (payload: {
    fullName?: string;
    username?: string;
    avatar?: string;
}) => {
    const res = await api.patch<ApiSuccessResponse<AuthUserResponse>>("/auth/me", payload);
    return unwrapApiResponse(res.data);
};

export const uploadCurrentUserAvatar = async (imageData: string) => {
    const uploadRoutes = [
        "/auth/avatar",
        "/auth/upload-avatar",
        "/auth/me/avatar",
        "/auth/me/upload-avatar",
    ];

    let lastError: unknown;

    for (const route of uploadRoutes) {
        try {
            const res = await api.post<ApiSuccessResponse<AuthUserResponse>>(route, { imageData });
            return unwrapApiResponse(res.data);
        } catch (error: any) {
            lastError = error;

            if (error?.response?.status !== 404) {
                throw error;
            }
        }
    }

    throw lastError;
};

export const deleteCurrentUser = async () => {
    const res = await api.delete<ApiSuccessResponse<null>>("/auth/me");
    return res.data;
};

export const logoutCurrentUser = async () => {
    const res = await api.post<ApiSuccessResponse<null>>("/auth/logout");
    return res.data;
};

export const refreshSession = async () => {
    const res = await api.post<ApiSuccessResponse<{ user: User; accessToken: string; refreshToken: string }>>("/auth/refresh", undefined, {
        skipAuthRefresh: true,
    });
    return unwrapApiResponse(res.data);
};
