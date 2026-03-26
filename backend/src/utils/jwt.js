import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

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
    },
  );
}

export function signGoogleSignupToken(payload) {
  return jwt.sign(
    { type: "google_signup", ...payload },
    env.jwtSecret,
    { expiresIn: "15m" },
  );
}

export function verifyGoogleSignupToken(token) {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (decoded.type !== "google_signup") {
    throw new Error("Invalid token type");
  }
  return decoded;
}
