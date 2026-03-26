import {
  completeRegistration,
  completeGoogleRegistration,
  loginLocalUser,
  loginWithGoogle,
  requestForgotPasswordOtp,
  requestSignupOtp,
  resetPasswordWithOtp,
  verifyOtp,
  verifyForgotPasswordOtp,
} from "../services/auth.service.js";

/** POST /auth/request-signup-otp */
export async function requestSignupOtpHandler(req, res) {
  const result = await requestSignupOtp(req.body);

  res.status(201).json({
    success: true,
    message: "OTP sent to your email.",
    user: result.user,
    otpExpiresAt: result.otpExpiresAt,
    emailDelivered: result.mailResult.delivered,
  });
}

/** POST /auth/complete-registration */
export async function completeRegistrationHandler(req, res) {
  const result = await completeRegistration(req.body);

  res.json({
    success: true,
    message: "Account created successfully.",
    token: result.token,
    user: result.user,
  });
}

/** POST /auth/verify-otp */
export async function verifyOtpCode(req, res) {
  const user = await verifyOtp(req.body);

  res.json({
    success: true,
    message: "Email verified successfully.",
    user,
  });
}

/** POST /auth/login */
export async function login(req, res) {
  const result = await loginLocalUser(req.body);

  res.json({
    success: true,
    message: "Login successful.",
    token: result.token,
    user: result.user,
  });
}

/** POST /auth/google */
export async function googleLogin(req, res) {
  const result = await loginWithGoogle(req.body);

  if (result.isNewUser) {
    return res.json({
      success: true,
      isNewUser: true,
      email: result.email,
      displayName: result.displayName,
      avatarUrl: result.avatarUrl,
      googleSignupToken: result.googleSignupToken,
    });
  }

  res.json({
    success: true,
    message: "Google login successful.",
    token: result.token,
    user: result.user,
  });
}

/** POST /auth/complete-google-registration */
export async function completeGoogleRegistrationHandler(req, res) {
  const result = await completeGoogleRegistration(req.body);

  res.json({
    success: true,
    message: "Account created successfully.",
    token: result.token,
    user: result.user,
  });
}

/** POST /auth/forgot-password/request-otp */
export async function requestForgotPasswordOtpHandler(req, res) {
  await requestForgotPasswordOtp(req.body);

  res.json({
    success: true,
    message: "If this email exists, a reset code has been sent.",
  });
}

/** POST /auth/forgot-password/verify-otp */
export async function verifyForgotPasswordOtpHandler(req, res) {
  await verifyForgotPasswordOtp(req.body);

  res.json({
    success: true,
    message: "OTP verified successfully.",
  });
}

/** POST /auth/forgot-password/reset */
export async function resetPasswordWithOtpHandler(req, res) {
  await resetPasswordWithOtp(req.body);

  res.json({
    success: true,
    message: "Password reset successful.",
  });
}

/** POST /auth/logout */
export function logout(_req, res) {
  res.json({
    success: true,
    message: "Logout successful!",
  });
}
