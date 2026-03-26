export const env = {
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  jwtSecret: (() => {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is required");
    }
    return process.env.JWT_SECRET;
  })(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  mongoUri: process.env.MONGODB_URI || "",
  otpExpiresInMinutes: Number(process.env.OTP_EXPIRES_IN_MINUTES || 10),
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || "no-reply@mixichat.com",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  nodeEnv: process.env.NODE_ENV || "development",
};