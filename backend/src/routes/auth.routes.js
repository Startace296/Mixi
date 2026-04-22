import { Router } from "express";

import {
  completeGoogleRegistrationHandler,
  completeRegistrationHandler,
  getCurrentUserHandler,
  googleLogin,
  login,
  logout,
  requestForgotPasswordOtpHandler,
  requestSignupOtpHandler,
  resetPasswordWithOtpHandler,
  updateCurrentUserAvatarHandler,
  updateCurrentUserHandler,
  verifyForgotPasswordOtpHandler,
  verifyOtpCode,
} from "../controllers/auth.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { validateBody } from "../middlewares/validation.middleware.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { avatarUpload } from "../middlewares/upload.middleware.js";
import { loginRateLimit, sendOtpRateLimit } from "../middlewares/rate-limit.middleware.js";
import {
  sendOtpSchema,
  verifyOtpSchema,
  loginSchema,
  googleLoginSchema,
  updateProfileSchema,
} from "../validation/auth.schemas.js";

const router = Router();

router.post("/request-signup-otp", sendOtpRateLimit, validateBody(sendOtpSchema), asyncHandler(requestSignupOtpHandler));
router.post("/verify-otp", validateBody(verifyOtpSchema), asyncHandler(verifyOtpCode));
router.post("/complete-registration", asyncHandler(completeRegistrationHandler));
router.post("/login", loginRateLimit, validateBody(loginSchema), asyncHandler(login));
router.post("/google", validateBody(googleLoginSchema), asyncHandler(googleLogin));
router.post("/complete-google-registration", asyncHandler(completeGoogleRegistrationHandler));
router.get("/me", requireAuth, asyncHandler(getCurrentUserHandler));
router.patch("/me", requireAuth, validateBody(updateProfileSchema), asyncHandler(updateCurrentUserHandler));
router.post("/me/avatar", requireAuth, avatarUpload.single("avatar"), asyncHandler(updateCurrentUserAvatarHandler));
router.post("/forgot-password/request-otp", sendOtpRateLimit, validateBody(sendOtpSchema), asyncHandler(requestForgotPasswordOtpHandler));
router.post("/forgot-password/verify-otp", validateBody(verifyOtpSchema), asyncHandler(verifyForgotPasswordOtpHandler));
router.post("/forgot-password/reset", asyncHandler(resetPasswordWithOtpHandler));
router.post("/logout", logout);

export default router;
