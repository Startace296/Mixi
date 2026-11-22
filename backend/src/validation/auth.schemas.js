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

const otpCodeSchema = z
  .string({ required_error: "OTP code is required" })
  .regex(/^\d{6}$/, "OTP code must be a 6-digit number");

export const verifyOtpSchema = z.object({
  email: emailSchema,
  otpCode: otpCodeSchema,
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

export const resetPasswordSchema = z.object({
  email: emailSchema,
  otpCode: otpCodeSchema,
  newPassword: passwordSchema,
});

const GENDERS = ["Male", "Female", "Other"];
const MIN_BIRTH_YEAR = 1900;

/** Coerces "05" / 5 to an integer; a missing or non-numeric value means the date is missing. */
function datePartSchema(min, max, label) {
  return z.coerce
    .number({ invalid_type_error: "Date of birth is required" })
    .int(`${label} must be a whole number`)
    .min(min, `${label} is invalid`)
    .max(max, `${label} is invalid`);
}

/** Signup profile step shared by local and Google registration (age >= 18 is checked in the service). */
const signupProfileSchema = z
  .object({
    displayName: z
      .string({ required_error: "Display name is required" })
      .trim()
      .min(1, "Display name is required")
      .max(80, "Display name must be at most 80 characters long"),
    gender: z.enum(GENDERS, {
      errorMap: () => ({ message: "Please select a valid gender" }),
    }),
    day: datePartSchema(1, 31, "Day"),
    month: datePartSchema(1, 12, "Month"),
    year: datePartSchema(MIN_BIRTH_YEAR, new Date().getFullYear(), "Year"),
  });

/** Rejects dates that roll over, e.g. 31/02 -> 03/03. */
function isRealDate({ day, month, year }) {
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

const realDateRefinement = [isRealDate, { message: "Date of birth is invalid", path: ["day"] }];

export const completeRegistrationSchema = signupProfileSchema
  .extend({
    email: emailSchema,
    registrationToken: z
      .string({ required_error: "Registration token is required. Please verify your email first." })
      .min(1, "Registration token is required. Please verify your email first."),
    password: passwordSchema,
  })
  .refine(...realDateRefinement);

export const completeGoogleRegistrationSchema = signupProfileSchema
  .extend({
    googleSignupToken: z
      .string({ required_error: "Google signup token is required" })
      .min(1, "Google signup token is required"),
  })
  .refine(...realDateRefinement);

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
