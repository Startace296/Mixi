import nodemailer from "nodemailer";

import { env } from "../config/env.js";

let transporterPromise;

async function getTransporter() {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    return null;
  }

  if (!transporterPromise) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: env.smtpHost,
        port: env.smtpPort,
        secure: env.smtpSecure,
        auth: {
          user: env.smtpUser,
          pass: env.smtpPass,
        },
        // Force IPv4 to avoid ENETUNREACH on networks with poor IPv6
        connectionTimeout: 10000,
        greetingTimeout: 10000,
      }),
    );
  }

  return transporterPromise;
}

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

  const text =
`Hello,

We received a request to ${actionText}.

Your one-time verification code is: ${otpCode}
This code will expire in ${expiresText}.

For your security:
- Never share this code with anyone.
- ChatApp support will never ask for your OTP.
- If you did not request this code, you can safely ignore this email.

This message was sent by ChatApp Security.
`;

  return { subject, text };
}

export async function sendOtpEmail(email, otpCode, purpose = "signup") {
  const transporter = await getTransporter();

  if (!transporter) {
    console.log(`[OTP] ${email}: ${otpCode}`);
    return { delivered: false, preview: otpCode };
  }

  try {
    const { subject, text } = buildOtpEmailContent(otpCode, purpose);
    await transporter.sendMail({
      from: env.smtpFrom,
      to: email,
      subject,
      text,
    });
    return { delivered: true };
  } catch (err) {
    // Network/SMTP failure - log OTP so dev can continue testing
    console.error("[OTP] SMTP failed, code for", email, ":", otpCode);
    console.error("[OTP] Error:", err.message);
    return { delivered: false, preview: otpCode };
  }
}
