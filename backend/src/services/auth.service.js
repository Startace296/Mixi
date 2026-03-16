import bcrypt from "bcryptjs";

import User from "../models/User.js";
import { env } from "../config/env.js";
import { sendOtpEmail } from "./email.service.js";
import { verifyGoogleIdToken } from "./google-auth.service.js";
import { AppError } from "../utils/app-error.js";
import { generateOtp } from "../utils/otp.js";
import { signAccessToken } from "../utils/jwt.js";

function normalizeEmail(email) {
  return email?.trim().toLowerCase();
}

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

async function issueOtpForUser(user) {
  const otpCode = generateOtp();
  const otpExpiresAt = new Date(Date.now() + env.otpExpiresInMinutes * 60 * 1000);

  user.otpCode = otpCode;
  user.otpExpiresAt = otpExpiresAt;
  await user.save();

  const mailResult = await sendOtpEmail(user.email, otpCode);

  return {
    otpExpiresAt,
    mailResult,
  };
}

export async function registerLocalUser({ email, password, displayName }) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const existingUser = await User.findOne({ email: normalizedEmail }).select("+passwordHash +otpCode +otpExpiresAt");

  if (existingUser && existingUser.provider !== "local") {
    throw new AppError("This email is already registered with Google", 409);
  }

  if (existingUser && existingUser.isEmailVerified) {
    throw new AppError("Email is already registered", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user =
    existingUser ||
    new User({
      email: normalizedEmail,
      provider: "local",
    });

  user.displayName = displayName?.trim() || user.displayName || normalizedEmail.split("@")[0];
  user.passwordHash = passwordHash;
  user.isEmailVerified = false;

  const { otpExpiresAt, mailResult } = await issueOtpForUser(user);

  return {
    user: sanitizeUser(user),
    otpExpiresAt,
    mailResult,
  };
}

export async function resendOtp({ email }) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new AppError("Email is required", 400);
  }

  const user = await User.findOne({ email: normalizedEmail }).select("+otpCode +otpExpiresAt");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isEmailVerified) {
    throw new AppError("Email is already verified", 400);
  }

  const { otpExpiresAt, mailResult } = await issueOtpForUser(user);

  return {
    user: sanitizeUser(user),
    otpExpiresAt,
    mailResult,
  };
}

export async function verifyOtp({ email, otpCode }) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !otpCode) {
    throw new AppError("Email and otpCode are required", 400);
  }

  const user = await User.findOne({ email: normalizedEmail }).select("+otpCode +otpExpiresAt");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.otpCode || !user.otpExpiresAt) {
    throw new AppError("OTP is not available for this user", 400);
  }

  if (user.otpCode !== otpCode) {
    throw new AppError("Invalid OTP code", 400);
  }

  if (user.otpExpiresAt.getTime() < Date.now()) {
    throw new AppError("OTP code has expired", 400);
  }

  user.isEmailVerified = true;
  user.otpCode = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  return sanitizeUser(user);
}

export async function loginLocalUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  if (user.provider !== "local") {
    throw new AppError("Please login with Google for this account", 400);
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash || "");

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isEmailVerified) {
    throw new AppError("Email is not verified", 403);
  }

  user.lastLoginAt = new Date();
  await user.save();

  return {
    token: signAccessToken(user),
    user: sanitizeUser(user),
  };
}

export async function loginWithGoogle({ idToken }) {
  const googleProfile = await verifyGoogleIdToken(idToken);

  let user = await User.findOne({
    provider: "google",
    providerId: googleProfile.providerId,
  });

  if (!user) {
    const existingEmailUser = await User.findOne({ email: googleProfile.email });

    if (existingEmailUser) {
      throw new AppError("Email is already registered with another auth method", 409);
    }

    user = await User.create({
      email: googleProfile.email,
      displayName: googleProfile.displayName || googleProfile.email.split("@")[0],
      avatarUrl: googleProfile.avatarUrl,
      provider: "google",
      providerId: googleProfile.providerId,
      isEmailVerified: true,
      lastLoginAt: new Date(),
    });
  } else {
    user.displayName = user.displayName || googleProfile.displayName;
    user.avatarUrl = googleProfile.avatarUrl || user.avatarUrl;
    user.isEmailVerified = true;
    user.lastLoginAt = new Date();
    await user.save();
  }

  return {
    token: signAccessToken(user),
    user: sanitizeUser(user),
  };
}
