import { Router } from "express";

import {
  googleLogin,
  login,
  logout,
  refreshToken,
  register,
  sendOtp,
  verifyOtpCode,
} from "../controllers/auth.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { loginRateLimit, sendOtpRateLimit } from "../middlewares/rate-limit.middleware.js";
import { validateBody } from "../middlewares/validation.middleware.js";
import {
  googleLoginSchema,
  loginSchema,
  registerSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from "../validation/auth.schemas.js";

const router = Router();

router.post("/register", validateBody(registerSchema), asyncHandler(register));
router.post("/send-otp", sendOtpRateLimit, validateBody(sendOtpSchema), asyncHandler(sendOtp));
router.post("/verify-otp", validateBody(verifyOtpSchema), asyncHandler(verifyOtpCode));
router.post("/login", loginRateLimit, validateBody(loginSchema), asyncHandler(login));
router.post("/google", validateBody(googleLoginSchema), asyncHandler(googleLogin));
router.post("/refresh-token", asyncHandler(refreshToken));
router.post("/logout", asyncHandler(logout));

export default router;
