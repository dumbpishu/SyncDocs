import { z } from 'zod';

const emailSchema = z.email({ message: "Invalid email address" }).min(5).max(255).trim().toLowerCase();

export const sendOtpSchema = z.object({
    email: emailSchema
});

export const verifyOtpSchema = z.object({
    email: emailSchema,
    otp: z.string().length(6, { message: "OTP must be 6 digits" })
});

export const updateAccountSchema = z.object({
    fullName: z.string().trim().min(3).max(50).optional(),
    username: z.string().trim().min(3).max(30).toLowerCase().optional(),
    avatar: z.string().trim().url({ message: "Avatar must be a valid URL" }).or(z.literal("")).optional()
}).refine((data) => data.fullName !== undefined || data.username !== undefined || data.avatar !== undefined, {
    message: "At least one field is required"
});

export const uploadAvatarSchema = z.object({
    imageData: z.string().trim().min(1).max(20_000_000)
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type UploadAvatarInput = z.infer<typeof uploadAvatarSchema>;
