import {
  loginLocalUser,
  loginWithGoogle,
  refreshAccessToken,
  registerLocalUser,
  resendOtp,
  verifyOtp,
} from "../services/auth.service.js";
import User from "../models/User.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";
import { hashToken } from "../utils/jwt.js";

const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function getRefreshTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: env.nodeEnv !== "development",
    sameSite: env.nodeEnv === "development" ? "lax" : "none",
    path: "/auth",
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
  };
}

function getRefreshTokenFromRequest(req) {
  const cookieHeader = req.headers.cookie || "";
  const cookieMatch = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${REFRESH_TOKEN_COOKIE_NAME}=`));

  if (cookieMatch) {
    return decodeURIComponent(cookieMatch.slice(REFRESH_TOKEN_COOKIE_NAME.length + 1));
  }

  return req.body?.refreshToken;
}

function setRefreshTokenCookie(res, refreshToken) {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, getRefreshTokenCookieOptions());
}

function clearRefreshTokenCookie(res) {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: env.nodeEnv !== "development",
    sameSite: env.nodeEnv === "development" ? "lax" : "none",
    path: "/auth",
  });
}

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

  setRefreshTokenCookie(res, result.refreshToken);

  res.json({
    message: "Login successful.",
    token: result.token,
    expiresIn: result.expiresIn,
    user: result.user,
  });
}

export async function googleLogin(req, res) {
  const result = await loginWithGoogle(req.body);

  setRefreshTokenCookie(res, result.refreshToken);

  res.json({
    message: "Google login successful.",
    token: result.token,
    expiresIn: result.expiresIn,
    user: result.user,
  });
}

export async function refreshToken(req, res) {
  const refreshTokenValue = getRefreshTokenFromRequest(req);
  const result = await refreshAccessToken({ refreshToken: refreshTokenValue });

  setRefreshTokenCookie(res, result.refreshToken);

  res.json({
    message: "Token refreshed successfully.",
    token: result.token,
    expiresIn: result.expiresIn,
    user: result.user,
  });
}

export async function logout(req, res) {
  const refreshTokenValue = getRefreshTokenFromRequest(req);

  if (!refreshTokenValue) {
    throw new AppError("Refresh token is required", 400);
  }

  const refreshTokenHash = hashToken(refreshTokenValue);

  const user = await User.findOne({
    refreshTokenHash,
  }).select("+refreshTokenHash +refreshTokenExpiresAt");

  if (user) {
    user.refreshTokenHash = undefined;
    user.refreshTokenExpiresAt = undefined;
    await user.save();
  }

  clearRefreshTokenCookie(res);

  return res.json({
    message: "Logout successful",
  });
}
