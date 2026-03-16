import {
  loginLocalUser,
  loginWithGoogle,
  registerLocalUser,
  resendOtp,
  verifyOtp,
} from "../services/auth.service.js";

export async function register(req, res) {
  const result = await registerLocalUser(req.body);

  res.status(201).json({
    message: "Register successful. OTP sent.",
    user: result.user,
    otpExpiresAt: result.otpExpiresAt,
    emailDelivered: result.mailResult.delivered,
  });
}

export async function sendOtp(req, res) {
  const result = await resendOtp(req.body);

  res.json({
    message: "OTP sent successfully.",
    user: result.user,
    otpExpiresAt: result.otpExpiresAt,
    emailDelivered: result.mailResult.delivered,
  });
}

export async function verifyOtpCode(req, res) {
  const user = await verifyOtp(req.body);

  res.json({
    message: "Email verified successfully.",
    user,
  });
}

export async function login(req, res) {
  const result = await loginLocalUser(req.body);

  res.json({
    message: "Login successful.",
    token: result.token,
    user: result.user,
  });
}

export async function googleLogin(req, res) {
  const result = await loginWithGoogle(req.body);

  res.json({
    message: "Google login successful.",
    token: result.token,
    user: result.user,
  });
}

export function logout(_req, res) {
  res.json({
    message: "Logout successful!",
  });
}
