import User from "../../models/User.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import { generateOtp, hashOtp } from "../../utils/otp.js";
import { sendOtpEmail } from "../../lib/mailer.js";

const MAX_OTP_ATTEMPTS = 5;
const TOO_MANY_OTP_ATTEMPTS_MESSAGE =
  "Too many incorrect OTP attempts. The code has been cancelled, please request a new one.";

/** Generates a new OTP, stores only its hash on the user and emails the raw code. */
export async function issueOtpForUser(user, purpose = "signup") {
  const otpCode = generateOtp();
  const otpCodeHash = hashOtp(otpCode);
  const otpExpiresAt = new Date(Date.now() + env.otpExpiresInMinutes * 60 * 1000);

  user.otpCode = otpCodeHash;
  user.otpExpiresAt = otpExpiresAt;
  user.otpAttempts = 0;
  await user.save();

  const mailResult = await sendOtpEmail(user.email, otpCode, purpose);

  return {
    otpExpiresAt,
    mailResult,
  };
}

/** Clears the OTP fields on a loaded user document (caller saves). */
export function clearOtpFields(user) {
  user.otpCode = undefined;
  user.otpExpiresAt = undefined;
  user.otpAttempts = 0;
}

async function cancelOtp(userId) {
  await User.updateOne({ _id: userId }, { $unset: { otpCode: 1, otpExpiresAt: 1 } });
}

/**
 * Checks an OTP while enforcing MAX_OTP_ATTEMPTS. An attempt is reserved atomically
 * BEFORE comparing, so parallel guesses cannot get past the limit. Once the limit is
 * reached with a wrong code, the OTP is cancelled and the user must request a new one.
 * Returns the user document with the OTP fields as they were at check time.
 */
export async function checkOtpWithAttemptLimit(userId, otpCode, { invalidMessage, expiredMessage }) {
  const reserved = await User.findOneAndUpdate(
    {
      _id: userId,
      otpCode: { $exists: true },
      $or: [{ otpAttempts: { $lt: MAX_OTP_ATTEMPTS } }, { otpAttempts: { $exists: false } }],
    },
    { $inc: { otpAttempts: 1 } },
    { returnDocument: "after" },
  ).select("+otpCode +otpExpiresAt +otpAttempts");

  if (!reserved) {
    // Either no OTP is pending or the attempt budget is already spent.
    const current = await User.findById(userId).select("+otpCode +otpAttempts");
    if (current && (current.otpCode || current.otpAttempts >= MAX_OTP_ATTEMPTS)) {
      if (current.otpCode) await cancelOtp(userId);
      throw new AppError(TOO_MANY_OTP_ATTEMPTS_MESSAGE, 429);
    }
    throw new AppError(invalidMessage, 400);
  }

  if (reserved.otpCode !== hashOtp(String(otpCode))) {
    if (reserved.otpAttempts >= MAX_OTP_ATTEMPTS) {
      await cancelOtp(userId);
      throw new AppError(TOO_MANY_OTP_ATTEMPTS_MESSAGE, 429);
    }
    throw new AppError(invalidMessage, 400);
  }

  if (!reserved.otpExpiresAt || reserved.otpExpiresAt.getTime() < Date.now()) {
    throw new AppError(expiredMessage, 400);
  }

  return reserved;
}
