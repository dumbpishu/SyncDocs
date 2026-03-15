import { AppError } from "../utils/appError";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

export const uploadImageToCloudinary = async (imageData: string, folder: string) => {
    if (!cloudName || !uploadPreset) {
        throw new AppError(500, "Cloudinary is not configured");
    }

    const formData = new FormData();
    formData.append("file", imageData);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", folder);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        throw new AppError(502, "Failed to upload image");
    }

    const data = await response.json() as { secure_url?: string };

    if (!data.secure_url) {
        throw new AppError(502, "Failed to upload image");
    }

    return data.secure_url;
};
