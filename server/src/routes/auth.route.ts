import express from "express";
import { sendOtp, verifyOtp, getCurrentUser, refreshSession } from "../controllers/auth.controller";
import { validateRequest } from "../middlewares/validate.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { sendOtpSchema, verifyOtpSchema } from "../validations/auth.validation";

const router = express.Router();

router.post("/send-otp", validateRequest(sendOtpSchema), sendOtp);
router.post("/verify-otp", validateRequest(verifyOtpSchema), verifyOtp);
router.post("/refresh", refreshSession);
router.get("/me", authMiddleware, getCurrentUser);

export default router;
