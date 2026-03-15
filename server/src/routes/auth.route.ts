import express from "express";
import {
    deleteCurrentUser,
    getCurrentUser,
    logoutCurrentUser,
    refreshSession,
    sendOtp,
    uploadCurrentUserAvatar,
    updateCurrentUser,
    verifyOtp
} from "../controllers/auth.controller";
import { validateRequest } from "../middlewares/validate.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { sendOtpSchema, updateAccountSchema, uploadAvatarSchema, verifyOtpSchema } from "../validations/auth.validation";

const router = express.Router();

router.post("/send-otp", validateRequest(sendOtpSchema), sendOtp);
router.post("/verify-otp", validateRequest(verifyOtpSchema), verifyOtp);
router.post("/refresh", refreshSession);
router.get("/me", authMiddleware, getCurrentUser);
router.patch("/me", authMiddleware, validateRequest(updateAccountSchema), updateCurrentUser);
router.post("/me/avatar", authMiddleware, validateRequest(uploadAvatarSchema), uploadCurrentUserAvatar);
router.post("/me/upload-avatar", authMiddleware, validateRequest(uploadAvatarSchema), uploadCurrentUserAvatar);
router.post("/avatar", authMiddleware, validateRequest(uploadAvatarSchema), uploadCurrentUserAvatar);
router.post("/upload-avatar", authMiddleware, validateRequest(uploadAvatarSchema), uploadCurrentUserAvatar);
router.post("/logout", authMiddleware, logoutCurrentUser);
router.delete("/me", authMiddleware, deleteCurrentUser);

export default router;
