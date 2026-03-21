import bcrypt from "bcryptjs";
import crypto from "crypto";

import User from "../models/User.js";
import { env } from "../config/env.js";
import { sendOtpEmail } from "./email.service.js";
import { verifyGoogleIdToken } from "./google-auth.service.js";
import { AppError } from "../utils/app-error.js";
import { generateOtp, hashOtp } from "../utils/otp.js";
import {
  getAccessTokenExpiresInSeconds,
  generateRefreshToken,
  hashToken,
  signAccessToken,
} from "../utils/jwt.js";

function normalizeEmail(email) {
  return email?.trim().toLowerCase();
}

const MAX_OTP_ATTEMPTS = 5;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_DURATION_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_EXPIRES_MS = 30 * 24 * 60 * 60 * 1000;

function sanitizeUser(user) {
  return {
    id: user._id,
    email: user.email,
    displayName: user.displayName,
    provider: user.provider,
    isEmailVerified: user.isEmailVerified,
    avatarUrl: user.avatarUrl,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

function createAuthTokens(user) {
  const token = signAccessToken(user);
  const refreshToken = generateRefreshToken();

  user.refreshTokenHash = hashToken(refreshToken);
  user.refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS);

  return {
    token,
    refreshToken,
    expiresIn: getAccessTokenExpiresInSeconds(),
  };
}

async function issueOtpForUser(user) {
  const otpCode = generateOtp();
  const hashedOtp = hashOtp(otpCode);
  const otpExpiresAt = new Date(Date.now() + env.otpExpiresInMinutes * 60 * 1000);

  user.otpCode = hashedOtp;
  user.otpExpiresAt = otpExpiresAt;
  user.otpAttempts = 0;
  await user.save();

  const mailResult = await sendOtpEmail(user.email, otpCode);

  return {
    otpExpiresAt,
    mailResult,
  };
}

async function saveLoginFailure(user) {
  user.loginAttempts = (user.loginAttempts || 0) + 1;

  if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
    user.lockUntil = new Date(Date.now() + LOGIN_LOCK_DURATION_MS);
  }

  await user.save();
}

async function clearLoginLock(user) {
  user.loginAttempts = 0;
  user.lockUntil = undefined;
}

function isLoginLocked(user) {
  return Boolean(user.lockUntil && user.lockUntil.getTime() > Date.now());
}

function clearExpiredLoginState(user) {
  if (user.lockUntil && user.lockUntil.getTime() <= Date.now()) {
    user.loginAttempts = 0;
    user.lockUntil = undefined;
  }
}

async function loadUserForOtp(email) {
  return User.findOne({ email: email }).select(
    "+otpCode +otpExpiresAt +otpAttempts +provider",
  );
}

export async function verifyOtp({ email, otpCode }) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !otpCode) {
    throw new AppError("Email and otpCode are required", 400);
  }

  const user = await loadUserForOtp(normalizedEmail);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.provider !== "local") {
    throw new AppError("OTP verification is only available for local accounts", 400);
  }

  if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
    throw new AppError("Too many attempts. Please request new OTP", 429);
  }

  if (!user.otpCode || !user.otpExpiresAt) {
    throw new AppError("OTP is not available for this user", 400);
  }

  if (user.otpExpiresAt.getTime() < Date.now()) {
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0;
    await user.save();
    throw new AppError("OTP code has expired", 400);
  }

  const hashedInput = hashOtp(otpCode);

  if (
    !crypto.timingSafeEqual(Buffer.from(user.otpCode), Buffer.from(hashedInput))
  ) {
    user.otpAttempts += 1;

    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      user.otpCode = undefined;
      user.otpExpiresAt = undefined;
    }

    await user.save();

    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      throw new AppError("Too many attempts. Please request new OTP", 429);
    }

    throw new AppError("Invalid OTP code", 400);
  }

  user.isEmailVerified = true;
  user.otpCode = undefined;
  user.otpExpiresAt = undefined;
  user.otpAttempts = 0;
  await user.save();

  return sanitizeUser(user);
}

export async function registerLocalUser({ email, password, displayName }) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const existingUser = await User.findOne({ email: normalizedEmail }).select(
    "+passwordHash +otpCode +otpExpiresAt +otpAttempts +provider +refreshTokenHash +refreshTokenExpiresAt",
  );

  if (existingUser?.provider === "google") {
    throw new AppError("An account already exists for this email with Google login", 409);
  }

  const user = existingUser || new User({ email: normalizedEmail });

  if (user.isEmailVerified) {
    throw new AppError("Email already registered", 409);
  }

  user.displayName = displayName?.trim() || user.displayName || "";
  user.provider = "local";
  user.passwordHash = await bcrypt.hash(password, 12);
  user.isEmailVerified = false;
  user.providerId = undefined;
  user.lastLoginAt = undefined;

  const result = await issueOtpForUser(user);

  return {
    user: sanitizeUser(user),
    otpExpiresAt: result.otpExpiresAt,
    mailResult: result.mailResult,
  };
}

export async function resendOtp({ email }) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new AppError("Email is required", 400);
  }

  const user = await loadUserForOtp(normalizedEmail);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.provider !== "local") {
    throw new AppError("OTP verification is only available for local accounts", 400);
  }

  if (user.isEmailVerified) {
    throw new AppError("Email already verified", 400);
  }

  const result = await issueOtpForUser(user);

  return {
    user: sanitizeUser(user),
    otpExpiresAt: result.otpExpiresAt,
    mailResult: result.mailResult,
  };
}

export async function loginLocalUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+passwordHash +loginAttempts +lockUntil +provider +refreshTokenHash +refreshTokenExpiresAt",
  );

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  clearExpiredLoginState(user);

  if (isLoginLocked(user)) {
    throw new AppError("Too many login attempts. Please try again later.", 429);
  }

  if (user.provider !== "local" || !user.passwordHash) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    await saveLoginFailure(user);
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isEmailVerified) {
    throw new AppError("Email is not verified", 403);
  }

  await clearLoginLock(user);
  user.lastLoginAt = new Date();
  const tokens = createAuthTokens(user);
  await user.save();

  return {
    token: tokens.token,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
    user: sanitizeUser(user),
  };
}

export async function loginWithGoogle({ idToken }) {
  const googleUser = await verifyGoogleIdToken(idToken);
  const normalizedEmail = normalizeEmail(googleUser.email);

  const existingUser = await User.findOne({
    $or: [
      { provider: "google", providerId: googleUser.providerId },
      { email: normalizedEmail },
    ],
  }).select(
    "+provider +providerId +refreshTokenHash +refreshTokenExpiresAt +loginAttempts +lockUntil",
  );

  if (existingUser && existingUser.provider === "local") {
    throw new AppError("An account already exists for this email with password login", 409);
  }

  const user =
    existingUser ||
    new User({
      email: normalizedEmail,
      provider: "google",
      providerId: googleUser.providerId,
      isEmailVerified: true,
    });

  user.email = normalizedEmail;
  user.provider = "google";
  user.providerId = googleUser.providerId;
  user.displayName = googleUser.displayName || user.displayName || "";
  user.avatarUrl = googleUser.avatarUrl || user.avatarUrl || "";
  user.isEmailVerified = true;
  user.lastLoginAt = new Date();

  await clearLoginLock(user);
  const tokens = createAuthTokens(user);
  await user.save();

  return {
    token: tokens.token,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
    user: sanitizeUser(user),
  };
}

export async function refreshAccessToken({ refreshToken }) {
  if (!refreshToken) {
    throw new AppError("Refresh token is required", 400);
  }

  const refreshTokenHash = hashToken(refreshToken);
  const user = await User.findOne({
    refreshTokenHash,
    refreshTokenExpiresAt: { $gt: new Date() },
  }).select(
    "+refreshTokenHash +refreshTokenExpiresAt +provider +providerId +loginAttempts +lockUntil",
  );

  if (!user) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const tokens = createAuthTokens(user);
  await user.save();

  return {
    token: tokens.token,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
    user: sanitizeUser(user),
  };
}
