import bcrypt from "bcryptjs";

import { AppError } from "./app-error.js";

const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

export function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash || "");
}

/** Throws 400 unless the password is a string of at least 8 non-blank characters. */
export function assertPasswordStrength(password) {
  if (typeof password !== "string" || password.trim().length < MIN_PASSWORD_LENGTH) {
    throw new AppError("Password must be at least 8 characters", 400);
  }
}
