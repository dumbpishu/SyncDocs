import { z } from 'zod';

export const sendOtpSchema = z.object({
    email: z.email({ message: "Invalid email address" }).min(5).max(255).trim().toLowerCase()
});

export const verifyOtpSchema = z.object({
    email: z.email({ message: "Invalid email address" }).min(5).max(255).trim().toLowerCase(),
    otp: z.string().length(6, { message: "OTP must be 6 digits" })
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;