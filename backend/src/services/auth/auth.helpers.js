import crypto from "crypto";

import { sanitizeUser } from "../../mappers/user.mapper.js";
import { AppError } from "../../utils/app-error.js";
import { ensureAdult } from "../../utils/date-of-birth.utils.js";
import { signAccessToken } from "../../utils/jwt.js";

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function normalizeEmail(email) {
  return email?.trim().toLowerCase();
}

/** Validates the profile step of a signup and returns the parsed birth date. */
export function validateProfileInfo({ displayName, gender, day, month, year }) {
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
  ensureAdult(birthDate);

  return birthDate;
}

/** The `{ token, user }` payload returned by every successful login/registration. */
export function buildAuthResponse(user) {
  return {
    token: signAccessToken(user),
    user: sanitizeUser(user),
  };
}
