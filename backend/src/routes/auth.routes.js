import { Router } from "express";

import {
  completeGoogleRegistrationHandler,
  completeRegistrationHandler,
  googleLogin,
  login,
  logout,
  requestForgotPasswordOtpHandler,
  requestSignupOtpHandler,
  resetPasswordWithOtpHandler,
  verifyForgotPasswordOtpHandler,
  verifyOtpCode,
} from "../controllers/auth.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.post("/request-signup-otp", asyncHandler(requestSignupOtpHandler));
router.post("/forgot-password/request-otp", asyncHandler(requestForgotPasswordOtpHandler));
router.post("/forgot-password/verify-otp", asyncHandler(verifyForgotPasswordOtpHandler));
router.post("/forgot-password/reset", asyncHandler(resetPasswordWithOtpHandler));
router.post("/complete-registration", asyncHandler(completeRegistrationHandler));
router.post("/complete-google-registration", asyncHandler(completeGoogleRegistrationHandler));
router.post("/verify-otp", asyncHandler(verifyOtpCode));
router.post("/login", asyncHandler(login));
router.post("/google", asyncHandler(googleLogin));
router.post("/logout", logout);

export default router;
