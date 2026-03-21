import { z } from "zod";

const emailSchema = z.string().trim().email("Please enter a valid email address");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must be at most 128 characters long");

const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Display name is required")
  .max(80, "Display name must be at most 80 characters long")
  .optional();

const loginPasswordSchema = z
  .string()
  .min(1, "Password is required")
  .max(128, "Password must be at most 128 characters long");

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export const verifyOtpSchema = z.object({
  email: emailSchema,
  otpCode: z
    .string()
    .regex(/^\d{6}$/, "OTP code must be a 6-digit number"),
});

export const sendOtpSchema = z.object({
  email: emailSchema,
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(32, "Refresh token is required"),
});

export const googleLoginSchema = z.object({
  idToken: z.string().min(1, "Google token is required"),
});
