import { Response } from "express";

const FIFTEEN_MINUTES_IN_MS = 15 * 60 * 1000;
const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;

const getCookieOptions = (maxAge: number) => ({
    path: "/",
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? ("none" as const) : ("lax" as const),
    secure: process.env.NODE_ENV === "production",
    maxAge
});

export const authCookieDurations = {
    accessToken: FIFTEEN_MINUTES_IN_MS,
    refreshToken: SEVEN_DAYS_IN_MS
};

export const setSessionCookies = (res: Response, accessToken: string, refreshToken: string) => {
    res.cookie("accessToken", accessToken, getCookieOptions(authCookieDurations.accessToken));
    res.cookie("refreshToken", refreshToken, getCookieOptions(authCookieDurations.refreshToken));
};

export const clearSessionCookies = (res: Response) => {
    res.clearCookie("accessToken", getCookieOptions(0));
    res.clearCookie("refreshToken", getCookieOptions(0));
};
