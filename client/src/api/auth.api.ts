import { api } from "../services/axios";
import type { AuthUserResponse, User } from "../types/auth";

export const sendOtp = async (email: string) => {
    const res = await api.post("/auth/send-otp", { email });
    return res.data;
}

export const verifyOtp = async (email: string, otp: string) => {
    const res = await api.post("/auth/verify-otp", { email, otp });
    return res.data as { message: string; user: User };
}

export const getCurrentUser = async () => {
    const res = await api.get("/auth/me");
    return res.data as AuthUserResponse;
}

export const refreshSession = async () => {
    const res = await api.post("/auth/refresh", undefined, {
        skipAuthRefresh: true,
    });
    return res.data as AuthUserResponse;
}
