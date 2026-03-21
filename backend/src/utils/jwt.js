import crypto from "crypto";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

function parseDurationToSeconds(duration) {
  if (typeof duration === "number" && Number.isFinite(duration)) {
    return duration;
  }

  if (typeof duration !== "string" || !duration.trim()) {
    return 0;
  }

  const trimmed = duration.trim();

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  const match = trimmed.match(/^(\d+)([smhdw])$/i);
  if (!match) {
    return 0;
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 24 * 60 * 60;
    case "w":
      return value * 7 * 24 * 60 * 60;
    default:
      return 0;
  }
}

export function getAccessTokenExpiresInSeconds() {
  return parseDurationToSeconds(env.jwtExpiresIn);
}

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      provider: user.provider,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
      issuer: "mixichat",
      audience: "mixichat-users",
    },
  );
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret, {
      issuer: "mixichat",
      audience: "mixichat-users",
    });
  } catch {
    return null;
  }
}

export function generateRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
