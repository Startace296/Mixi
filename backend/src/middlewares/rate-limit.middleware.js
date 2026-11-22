import { rateLimit } from "express-rate-limit";

// Rate limits are per-process in-memory counters; disable them in the test suite so
// many requests from the same supertest IP do not trip them.
const skipInTests = () => process.env.NODE_ENV === "test";

const rateLimitHandler = (message) => (_req, res, _next, options) => {
  res.status(options.statusCode).json({
    message,
  });
};

export const loginRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: "Too many login attempts. Please try again in a minute.",
  handler: rateLimitHandler("Too many login attempts. Please try again in a minute."),
});

export const sendOtpRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: "Too many OTP requests. Please try again in a minute.",
  handler: rateLimitHandler("Too many OTP requests. Please try again in a minute."),
});

// Per-IP cap on OTP guesses. The per-OTP limit (5 wrong tries, then the code is
// cancelled) lives in auth.service; this one stops a single client from spraying
// guesses across many emails or many freshly requested codes.
export const verifyOtpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: "Too many OTP verification attempts. Please try again later.",
  handler: rateLimitHandler("Too many OTP verification attempts. Please try again later."),
});

export const resetPasswordRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: "Too many password reset attempts. Please try again later.",
  handler: rateLimitHandler("Too many password reset attempts. Please try again later."),
});
