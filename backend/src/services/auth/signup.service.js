// Local (email + password) signup: request OTP -> verify OTP -> complete registration.
import crypto from "crypto";

import User from "../../models/User.js";
import { sanitizeUser } from "../../mappers/user.mapper.js";
import { AppError } from "../../utils/app-error.js";
import { assertPasswordStrength, hashPassword } from "../../utils/password.utils.js";
import { buildAuthResponse, hashToken, normalizeEmail, validateProfileInfo } from "./auth.helpers.js";
import { checkOtpWithAttemptLimit, clearOtpFields, issueOtpForUser } from "./otp.js";

/** An unfinished signup is auto-deleted (TTL index on expireAt) after this long. */
const PENDING_SIGNUP_TTL_MS = 10 * 60 * 1000;
const REGISTRATION_TOKEN_TTL_MS = 30 * 60 * 1000;

export async function requestSignupOtp({ email }) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new AppError("Email is required", 400);
  }

  const existingUser = await User.findOne({ email: normalizedEmail }).select("+passwordHash +otpCode +otpExpiresAt");

  if (existingUser && existingUser.provider !== "local") {
    throw new AppError("This email is already registered with Google", 409);
  }

  // A verified user with a pending expireAt never finished registration, so they may restart.
  if (existingUser && existingUser.isEmailVerified && !existingUser.expireAt) {
    throw new AppError("Email is already registered", 409);
  }

  let user = existingUser;

  if (!user) {
    const tempHash = await hashPassword("pending_" + crypto.randomBytes(16).toString("hex"));
    user = await User.create({
      email: normalizedEmail,
      provider: "local",
      passwordHash: tempHash,
      displayName: normalizedEmail.split("@")[0],
      isEmailVerified: false,
      expireAt: new Date(Date.now() + PENDING_SIGNUP_TTL_MS),
    });
  } else {
    // Renew expiry window if user requests OTP again and invalidate any earlier
    // registration token: the new OTP must be verified before registration can complete.
    user.expireAt = new Date(Date.now() + PENDING_SIGNUP_TTL_MS);
    user.isEmailVerified = false;
    user.registrationTokenHash = undefined;
    user.registrationTokenExpiresAt = undefined;
    await user.save();
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

  await checkOtpWithAttemptLimit(user._id, otpCode, {
    invalidMessage: "Invalid OTP code",
    expiredMessage: "OTP code has expired",
  });

  // Proof that this client verified the OTP: only the hash is stored, the raw token
  // goes back to the client once and is consumed by completeRegistration.
  const registrationToken = crypto.randomBytes(32).toString("hex");
  const registrationTokenExpiresAt = new Date(Date.now() + REGISTRATION_TOKEN_TTL_MS);

  user.isEmailVerified = true;
  // Still pending: auto-delete if registration is never completed. Cleared on completion.
  user.expireAt = registrationTokenExpiresAt;
  clearOtpFields(user);
  user.registrationTokenHash = hashToken(registrationToken);
  user.registrationTokenExpiresAt = registrationTokenExpiresAt;
  await user.save();

  return {
    user: sanitizeUser(user),
    registrationToken,
    registrationTokenExpiresAt,
  };
}

export async function completeRegistration({
  email,
  registrationToken,
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

  assertPasswordStrength(password);
  if (typeof registrationToken !== "string" || !registrationToken) {
    throw new AppError("Registration token is required. Please verify your email first.", 400);
  }

  const birthDate = validateProfileInfo({ displayName, gender, day, month, year });

  // Atomically consume the one-time token so it cannot be replayed (even concurrently).
  const user = await User.findOneAndUpdate(
    {
      email: normalizedEmail,
      provider: "local",
      isEmailVerified: true,
      registrationTokenHash: hashToken(registrationToken),
      registrationTokenExpiresAt: { $gt: new Date() },
    },
    { $unset: { registrationTokenHash: 1, registrationTokenExpiresAt: 1 } },
    { returnDocument: "after" },
  ).select("+passwordHash");

  if (!user) {
    throw new AppError("Invalid or expired registration token. Please verify your email again.", 401);
  }

  user.passwordHash = await hashPassword(password);
  user.displayName = displayName.trim();
  user.gender = gender;
  user.dateOfBirth = birthDate;
  user.expireAt = null; // registration complete: keep the document forever
  user.lastLoginAt = new Date();
  await user.save();

  return buildAuthResponse(user);
}
