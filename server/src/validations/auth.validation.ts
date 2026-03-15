import { z } from 'zod';

const emailSchema = z.email({ message: "Invalid email address" }).min(5).max(255).trim().toLowerCase();

export const sendOtpSchema = z.object({
    email: emailSchema
});

export const verifyOtpSchema = z.object({
    email: emailSchema,
    otp: z.string().length(6, { message: "OTP must be 6 digits" })
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
