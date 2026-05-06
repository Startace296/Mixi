import { z } from "zod";

const MAX_BIO_CHARACTERS = 280;
const MAX_BIO_LINES = 4;

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

export const changePasswordSchema = z.object({
  currentPassword: loginPasswordSchema,
  newPassword: passwordSchema,
});

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(80, "Display name must be at most 80 characters long"),
  gender: z.enum(["Male", "Female", "Other"], {
    errorMap: () => ({ message: "Please select a valid gender" }),
  }),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  bio: z
    .string()
    .trim()
    .max(MAX_BIO_CHARACTERS, `Bio must be at most ${MAX_BIO_CHARACTERS} characters long`)
    .refine((value) => {
      if (!value) return true;
      const lineCount = value.replace(/\r\n?/g, "\n").split("\n").length;
      return lineCount <= MAX_BIO_LINES;
    }, `Bio must be at most ${MAX_BIO_LINES} lines long`)
    .optional()
    .or(z.literal("")),
  location: z.string().trim().max(120, "Location must be at most 120 characters long").optional().or(z.literal("")),
});
