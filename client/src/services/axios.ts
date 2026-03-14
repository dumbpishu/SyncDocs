import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

type RetryableRequestConfig = InternalAxiosRequestConfig & {
    _retry?: boolean;
    skipAuthRefresh?: boolean;
};

let refreshRequest: Promise<void> | null = null;
let handleSessionExpired: (() => void) | null = null;

const refreshAccessToken = async () => {
    if (!refreshRequest) {
        refreshRequest = api.post("/auth/refresh", undefined, {
            skipAuthRefresh: true,
        } as RetryableRequestConfig).then(() => undefined).finally(() => {
            refreshRequest = null;
        });
    }

    return refreshRequest;
};

export const registerSessionExpiredHandler = (handler: (() => void) | null) => {
    handleSessionExpired = handler;
};

const redirectToLandingPage = () => {
    if (window.location.pathname !== "/") {
        window.location.replace("/");
    }
};

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as RetryableRequestConfig | undefined;

        if (!originalRequest) {
            return Promise.reject(error);
        }

        const shouldRefresh =
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.skipAuthRefresh &&
            !originalRequest.url?.includes("/auth/refresh");

        if (!shouldRefresh) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            await refreshAccessToken();
            return api(originalRequest);
        } catch (refreshError) {
            handleSessionExpired?.();
            redirectToLandingPage();
            return Promise.reject(refreshError);
        }
    }
);
