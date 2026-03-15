import crypto from "crypto";
import { AppError } from "../utils/appError";

const getCloudinaryConfig = () => ({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    apiKey: process.env.CLOUDINARY_API_KEY?.trim(),
    apiSecret: process.env.CLOUDINARY_API_SECRET?.trim(),
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET?.trim(),
});

export const uploadImageToCloudinary = async (imageData: string, folder: string) => {
    const { cloudName, apiKey, apiSecret, uploadPreset } = getCloudinaryConfig();

    if (!cloudName) {
        throw new AppError(500, "Cloudinary is not configured: CLOUDINARY_CLOUD_NAME is missing");
    }

    const formData = new FormData();
    formData.append("file", imageData);
    formData.append("folder", folder);

    if (apiKey && apiSecret) {
        const timestamp = Math.floor(Date.now() / 1000);
        const signatureBase = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash("sha1").update(signatureBase).digest("hex");

        formData.append("api_key", apiKey);
        formData.append("timestamp", String(timestamp));
        formData.append("signature", signature);
    } else if (uploadPreset) {
        formData.append("upload_preset", uploadPreset);
    } else {
        throw new AppError(
            500,
            "Cloudinary is not configured: set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET, or set CLOUDINARY_UPLOAD_PRESET"
        );
    }

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new AppError(502, errorText || "Failed to upload image");
    }

    const data = await response.json() as { secure_url?: string };

    if (!data.secure_url) {
        throw new AppError(502, "Failed to upload image");
    }

    return data.secure_url;
};
