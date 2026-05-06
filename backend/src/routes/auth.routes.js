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
import { loginRateLimit, sendOtpRateLimit } from "../middlewares/rate-limit.middleware.js";
import {
  changePasswordSchema,
  sendOtpSchema,
  verifyOtpSchema,
  loginSchema,
  googleLoginSchema,
} from "../validation/auth.schemas.js";

const router = Router();

router.post("/request-signup-otp", sendOtpRateLimit, validateBody(sendOtpSchema), asyncHandler(requestSignupOtpHandler));
router.post("/verify-otp", validateBody(verifyOtpSchema), asyncHandler(verifyOtpCode));
router.post("/complete-registration", asyncHandler(completeRegistrationHandler));
router.post("/login", loginRateLimit, validateBody(loginSchema), asyncHandler(login));
router.post("/google", validateBody(googleLoginSchema), asyncHandler(googleLogin));
router.post("/complete-google-registration", asyncHandler(completeGoogleRegistrationHandler));
router.post("/forgot-password/request-otp", sendOtpRateLimit, validateBody(sendOtpSchema), asyncHandler(requestForgotPasswordOtpHandler));
router.post("/forgot-password/verify-otp", validateBody(verifyOtpSchema), asyncHandler(verifyForgotPasswordOtpHandler));
router.post("/forgot-password/reset", asyncHandler(resetPasswordWithOtpHandler));
router.post("/change-password", requireAuth, validateBody(changePasswordSchema), asyncHandler(changePasswordHandler));
router.post("/logout", logout);

export default router;
