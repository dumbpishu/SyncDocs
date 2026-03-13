export const otpEmailTemplate = (otp: string) => {
    return `
        <div style="font-family: Arial; padding:20px">
            <h2>Your Login OTP</h2>
            <p>Your OTP is:</p>
            <h1>${otp}</h1>
            <p>This OTP will expire in 5 minutes.</p>
        </div>
    `;
};