// Google sign-in: existing accounts log straight in, new ones finish a profile step first.
import User from "../../models/User.js";
import { verifyGoogleIdToken } from "../../lib/google-auth.js";
import { AppError } from "../../utils/app-error.js";
import { signGoogleSignupToken, verifyGoogleSignupToken } from "../../utils/jwt.js";
import { buildAuthResponse, normalizeEmail, validateProfileInfo } from "./auth.helpers.js";

export async function loginWithGoogle({ idToken }) {
  const googleProfile = await verifyGoogleIdToken(idToken);

  const user = await User.findOne({
    provider: "google",
    providerId: googleProfile.providerId,
  });

  if (user) {
    user.displayName = user.displayName || googleProfile.displayName;
    // Keep a user-uploaded avatar on later Google logins; only fall back to Google's
    // photo if the account does not already have a custom avatar stored.
    user.avatarUrl = user.avatarUrl || googleProfile.avatarUrl;
    user.isEmailVerified = true;
    user.lastLoginAt = new Date();
    await user.save();
    return buildAuthResponse(user);
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

  return buildAuthResponse(user);
}
