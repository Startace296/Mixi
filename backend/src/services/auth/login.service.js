import User from "../../models/User.js";
import { AppError } from "../../utils/app-error.js";
import { verifyPassword } from "../../utils/password.utils.js";
import { buildAuthResponse, normalizeEmail } from "./auth.helpers.js";

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

  const isPasswordValid = await verifyPassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isEmailVerified) {
    throw new AppError("Email is not verified", 403);
  }

  user.lastLoginAt = new Date();
  await user.save();

  return buildAuthResponse(user);
}
