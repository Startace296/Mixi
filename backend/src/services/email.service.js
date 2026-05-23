import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpSecure,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
  requireTLS: true,
});

function buildOtpEmailContent(otpCode, purpose = "signup") {
  const expiresText = "1 minute";
  const actionText =
    purpose === "forgot_password"
      ? "reset your ChatApp password"
      : "complete your ChatApp account verification";
  const subject =
    purpose === "forgot_password"
      ? "ChatApp password reset verification code"
      : "ChatApp account verification code";

  const text = `Hello,

We received a request to ${actionText}.

Your one-time verification code is: ${otpCode}
This code will expire in ${expiresText}.

For your security:
- Never share this code with anyone.
- ChatApp support will never ask for your OTP.
- If you did not request this code, you can safely ignore this email.

This message was sent by ChatApp Security.`;

  return { subject, text };
}

export async function sendOtpEmail(email, otpCode, purpose = "signup") {
  try {
    const { subject, text } = buildOtpEmailContent(otpCode, purpose);
    await transporter.sendMail({
      from: env.smtpFrom || "no-reply@mixichat.com",
      to: email,
      subject,
      text,
    });
    console.log(`[OTP] Email sent to ${email}`);
    return { delivered: true };
  } catch (err) {
    console.error("[OTP] SMTP failed:", err.message);
    return { delivered: false };
  }
}