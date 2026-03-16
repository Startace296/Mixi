import { OAuth2Client } from "google-auth-library";

import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

const googleClient = new OAuth2Client(env.googleClientId || undefined);

export async function verifyGoogleIdToken(idToken) {
  if (!idToken) {
    throw new AppError("Google token is required", 400);
  }

  if (!env.googleClientId) {
    throw new AppError("GOOGLE_CLIENT_ID is required for Google login", 500);
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.googleClientId,
  });

  const payload = ticket.getPayload();

  if (!payload?.email || !payload?.sub) {
    throw new AppError("Invalid Google token payload", 401);
  }

  return {
    email: payload.email.toLowerCase(),
    providerId: payload.sub,
    displayName: payload.name || "",
    avatarUrl: payload.picture || "",
    isEmailVerified: Boolean(payload.email_verified),
  };
}
