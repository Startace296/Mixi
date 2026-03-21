import { rateLimit } from "express-rate-limit";

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
  message: "Too many login attempts. Please try again in a minute.",
  handler: rateLimitHandler("Too many login attempts. Please try again in a minute."),
});

export const sendOtpRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many OTP requests. Please try again in a minute.",
  handler: rateLimitHandler("Too many OTP requests. Please try again in a minute."),
});
