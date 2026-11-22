import { Router } from "express";

import {
  changePasswordHandler,
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
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validation.middleware.js";
import {
  loginRateLimit,
  resetPasswordRateLimit,
  sendOtpRateLimit,
  verifyOtpRateLimit,
} from "../middlewares/rate-limit.middleware.js";
import {
  changePasswordSchema,
  completeGoogleRegistrationSchema,
  completeRegistrationSchema,
  resetPasswordSchema,
  sendOtpSchema,
  verifyOtpSchema,
  loginSchema,
  googleLoginSchema,
} from "../validation/auth.schemas.js";

const router = Router();

router.post("/request-signup-otp", sendOtpRateLimit, validateBody(sendOtpSchema), asyncHandler(requestSignupOtpHandler));
router.post("/verify-otp", verifyOtpRateLimit, validateBody(verifyOtpSchema), asyncHandler(verifyOtpCode));
router.post("/complete-registration", validateBody(completeRegistrationSchema), asyncHandler(completeRegistrationHandler));
router.post("/login", loginRateLimit, validateBody(loginSchema), asyncHandler(login));
router.post("/google", validateBody(googleLoginSchema), asyncHandler(googleLogin));
router.post("/complete-google-registration", validateBody(completeGoogleRegistrationSchema), asyncHandler(completeGoogleRegistrationHandler));
router.post("/forgot-password/request-otp", sendOtpRateLimit, validateBody(sendOtpSchema), asyncHandler(requestForgotPasswordOtpHandler));
router.post("/forgot-password/verify-otp", verifyOtpRateLimit, validateBody(verifyOtpSchema), asyncHandler(verifyForgotPasswordOtpHandler));
router.post("/forgot-password/reset", resetPasswordRateLimit, validateBody(resetPasswordSchema), asyncHandler(resetPasswordWithOtpHandler));
router.post("/change-password", requireAuth, validateBody(changePasswordSchema), asyncHandler(changePasswordHandler));
router.post("/logout", logout);

export default router;
