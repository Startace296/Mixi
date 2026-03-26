import bcrypt from "bcryptjs";
import crypto from "crypto";

import User from "../models/User.js";
import { env } from "../config/env.js";
import { sendOtpEmail } from "./email.service.js";
import { verifyGoogleIdToken } from "./google-auth.service.js";
import { AppError } from "../utils/app-error.js";
import { generateOtp } from "../utils/otp.js";
import { signAccessToken, signGoogleSignupToken, verifyGoogleSignupToken } from "../utils/jwt.js";

function normalizeEmail(email) {
  return email?.trim().toLowerCase();
}

function validateProfileInfo({ displayName, gender, day, month, year }) {
  if (!displayName?.trim()) {
    throw new AppError("Display name is required", 400);
  }
  if (!gender) {
    throw new AppError("Gender is required", 400);
  }
  if (!day || !month || !year) {
    throw new AppError("Date of birth is required", 400);
  }

  const birthDate = new Date(Number(year), Number(month) - 1, Number(day));
  const today = new Date();
  const minAllowedDate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  );
  if (birthDate > minAllowedDate) {
    throw new AppError("You must be at least 18 years old", 400);
  }

  return birthDate;
}

function sanitizeUser(user) {
  const u = {
    id: user._id,
    email: user.email,
    displayName: user.displayName,
    provider: user.provider,
    isEmailVerified: user.isEmailVerified,
    avatarUrl: user.avatarUrl,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
  if (user.gender) u.gender = user.gender;
  if (user.dateOfBirth) u.dateOfBirth = user.dateOfBirth;
  return u;
}

async function issueOtpForUser(user, purpose = "signup") {
  const otpCode = generateOtp();
  const otpExpiresAt = new Date(Date.now() + env.otpExpiresInMinutes * 60 * 1000);

  user.otpCode = otpCode;
  user.otpExpiresAt = otpExpiresAt;
  await user.save();

  const mailResult = await sendOtpEmail(user.email, otpCode, purpose);

  return {
    otpExpiresAt,
    mailResult,
  };
}

export async function requestSignupOtp({ email }) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new AppError("Email is required", 400);
  }

  const existingUser = await User.findOne({ email: normalizedEmail }).select("+passwordHash +otpCode +otpExpiresAt");

  if (existingUser && existingUser.provider !== "local") {
    throw new AppError("This email is already registered with Google", 409);
  }

  if (existingUser && existingUser.isEmailVerified) {
    throw new AppError("Email is already registered", 409);
  }

  let user = existingUser;

  if (!user) {
    const tempHash = await bcrypt.hash(
      "pending_" + crypto.randomBytes(16).toString("hex"),
      12,
    );
    user = await User.create({
      email: normalizedEmail,
      provider: "local",
      passwordHash: tempHash,
      displayName: normalizedEmail.split("@")[0],
      isEmailVerified: false,
    });
  }

  const { otpExpiresAt, mailResult } = await issueOtpForUser(user, "signup");

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


export async function completeRegistration({
  email,
  password,
  displayName,
  gender,
  day,
  month,
  year,
}) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    throw new AppError("Email and password are required", 400);
  }

  if (typeof password !== "string" || password.trim().length < 8) {
    throw new AppError("Password must be at least 8 characters", 400);
  }
  const birthDate = validateProfileInfo({ displayName, gender, day, month, year });

  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.isEmailVerified) {
    throw new AppError("Email is not verified. Please verify your email first.", 403);
  }

  if (user.provider !== "local") {
    throw new AppError("This account uses Google sign-in", 400);
  }

  user.passwordHash = await bcrypt.hash(password, 12);
  user.displayName = displayName.trim();
  user.gender = gender;
  user.dateOfBirth = birthDate;
  user.lastLoginAt = new Date();
  await user.save();

  return {
    token: signAccessToken(user),
    user: sanitizeUser(user),
  };
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

  if (user) {
    user.displayName = user.displayName || googleProfile.displayName;
    user.avatarUrl = googleProfile.avatarUrl || user.avatarUrl;
    user.isEmailVerified = true;
    user.lastLoginAt = new Date();
    await user.save();
    return {
      token: signAccessToken(user),
      user: sanitizeUser(user),
    };
  }

  const existingEmailUser = await User.findOne({ email: googleProfile.email });
  if (existingEmailUser) {
    throw new AppError("Email is already registered with another auth method", 409);
  }

  const googleSignupToken = signGoogleSignupToken({
    email: googleProfile.email,
    displayName: googleProfile.displayName || "",
    avatarUrl: googleProfile.avatarUrl || "",
    providerId: googleProfile.providerId,
  });

  return {
    isNewUser: true,
    email: googleProfile.email,
    displayName: googleProfile.displayName || googleProfile.email.split("@")[0],
    avatarUrl: googleProfile.avatarUrl || "",
    googleSignupToken,
  };
}

export async function completeGoogleRegistration({
  googleSignupToken,
  displayName,
  gender,
  day,
  month,
  year,
}) {
  const payload = verifyGoogleSignupToken(googleSignupToken);

  const normalizedEmail = normalizeEmail(payload.email);
  if (!normalizedEmail) {
    throw new AppError("Invalid token", 400);
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError("Email is already registered", 409);
  }

  const birthDate = validateProfileInfo({ displayName, gender, day, month, year });

  const user = await User.create({
    email: normalizedEmail,
    displayName: displayName.trim(),
    avatarUrl: payload.avatarUrl || "",
    provider: "google",
    providerId: payload.providerId,
    isEmailVerified: true,
    lastLoginAt: new Date(),
    gender,
    dateOfBirth: birthDate,
  });

  return {
    token: signAccessToken(user),
    user: sanitizeUser(user),
  };
}

export async function requestForgotPasswordOtp({ email }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new AppError("Email is required", 400);
  }

  const user = await User.findOne({ email: normalizedEmail }).select("+otpCode +otpExpiresAt");
  if (!user || user.provider !== "local" || !user.isEmailVerified) {
    return {
      otpExpiresAt: null,
      mailResult: { delivered: false },
    };
  }

  const { otpExpiresAt, mailResult } = await issueOtpForUser(user, "forgot_password");
  return { otpExpiresAt, mailResult };
}

export async function verifyForgotPasswordOtp({ email, otpCode }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !otpCode) {
    throw new AppError("Email and otpCode are required", 400);
  }

  const user = await User.findOne({ email: normalizedEmail }).select("+otpCode +otpExpiresAt");
  if (!user || user.provider !== "local" || !user.otpCode || !user.otpExpiresAt) {
    throw new AppError("Invalid or expired OTP code", 400);
  }

  if (user.otpCode !== otpCode || user.otpExpiresAt.getTime() < Date.now()) {
    throw new AppError("Invalid or expired OTP code", 400);
  }

  return { email: normalizedEmail };
}

export async function resetPasswordWithOtp({ email, otpCode, newPassword }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !otpCode || !newPassword) {
    throw new AppError("Email, otpCode and newPassword are required", 400);
  }

  if (typeof newPassword !== "string" || newPassword.trim().length < 8) {
    throw new AppError("Password must be at least 8 characters", 400);
  }

  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash +otpCode +otpExpiresAt");
  if (!user || user.provider !== "local" || !user.otpCode || !user.otpExpiresAt) {
    throw new AppError("Invalid reset request", 400);
  }

  if (user.otpCode !== otpCode || user.otpExpiresAt.getTime() < Date.now()) {
    throw new AppError("Invalid or expired OTP code", 400);
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.otpCode = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  return { email: normalizedEmail };
}
