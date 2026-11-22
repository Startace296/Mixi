// Forgot password (request OTP -> verify OTP -> reset) and change password while logged in.
import User from "../../models/User.js";
import { sanitizeUser } from "../../mappers/user.mapper.js";
import { AppError } from "../../utils/app-error.js";
import { assertPasswordStrength, hashPassword, verifyPassword } from "../../utils/password.utils.js";
import { normalizeEmail } from "./auth.helpers.js";
import { checkOtpWithAttemptLimit, clearOtpFields, issueOtpForUser } from "./otp.js";

const INVALID_RESET_OTP_MESSAGES = {
  invalidMessage: "Invalid or expired OTP code",
  expiredMessage: "Invalid or expired OTP code",
};

export async function requestForgotPasswordOtp({ email }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new AppError("Email is required", 400);
  }

  const user = await User.findOne({ email: normalizedEmail }).select("+otpCode +otpExpiresAt");
  if (user && user.provider !== "local") {
    throw new AppError(
      "This account uses Google Sign-In. Password reset isn’t available. Please sign in with Google.",
      400,
    );
  }

  // Pending signups (expireAt set) have no real password yet; treat them as non-existent.
  if (!user || !user.isEmailVerified || user.expireAt) {
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

  await checkOtpWithAttemptLimit(user._id, otpCode, INVALID_RESET_OTP_MESSAGES);

  // The code is correct: give the reset step a fresh attempt budget (the OTP stays valid
  // until /forgot-password/reset consumes it).
  await User.updateOne({ _id: user._id }, { $set: { otpAttempts: 0 } });

  return { email: normalizedEmail };
}

export async function resetPasswordWithOtp({ email, otpCode, newPassword }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !otpCode || !newPassword) {
    throw new AppError("Email, otpCode and newPassword are required", 400);
  }

  assertPasswordStrength(newPassword);

  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash +otpCode +otpExpiresAt");
  if (!user || user.provider !== "local" || !user.otpCode || !user.otpExpiresAt) {
    throw new AppError("Invalid reset request", 400);
  }

  await checkOtpWithAttemptLimit(user._id, otpCode, INVALID_RESET_OTP_MESSAGES);

  user.passwordHash = await hashPassword(newPassword);
  clearOtpFields(user);
  await user.save();

  return { email: normalizedEmail };
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  if (!userId || !currentPassword || !newPassword) {
    throw new AppError("Current password and new password are required", 400);
  }

  assertPasswordStrength(newPassword);

  const user = await User.findById(userId).select("+passwordHash");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.provider !== "local") {
    throw new AppError("This account uses Google sign-in", 400);
  }

  const isCurrentPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isCurrentPasswordValid) {
    throw new AppError("Current password is incorrect", 400);
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  return sanitizeUser(user);
}
