import { Router } from "express";

import {
  googleLogin,
  login,
  logout,
  register,
  sendOtp,
  verifyOtpCode,
} from "../controllers/auth.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.post("/register", asyncHandler(register));
router.post("/send-otp", asyncHandler(sendOtp));
router.post("/verify-otp", asyncHandler(verifyOtpCode));
router.post("/login", asyncHandler(login));
router.post("/google", asyncHandler(googleLogin));
router.post("/logout", logout);

export default router;
