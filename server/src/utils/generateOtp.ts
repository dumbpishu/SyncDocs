import crypto from "crypto";
import bcrypt from "bcryptjs";

export const generateOtp = (length: number = 6): { otp: string; hashedOtp: string } => {
    const digits = "0123456789";

    let otp = "";

    for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(0, digits.length);
        otp += digits[randomIndex];
    }

    const hashedOtp = bcrypt.hashSync(otp, 10);

    return { otp, hashedOtp };
};
