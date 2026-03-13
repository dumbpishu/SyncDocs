import express from "express";
import { sendOtp } from "../controllers/auth.controller";
import { validateRequest } from "../middlewares/validate.middleware";
import { sendOtpSchema } from "../validations/auth.validation";

const router = express.Router();

router.post("/send-otp", validateRequest(sendOtpSchema), sendOtp);

export default router;