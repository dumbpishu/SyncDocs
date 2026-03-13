import express from "express";
import { sendOtp, verifyOtp } from "../controllers/auth.controller";
import { validateRequest } from "../middlewares/validate.middleware";
import { sendOtpSchema, verifyOtpSchema } from "../validations/auth.validation";

const router = express.Router();

router.post("/send-otp", validateRequest(sendOtpSchema), sendOtp);
router.post("/verify-otp", validateRequest(verifyOtpSchema), verifyOtp);

export default router;