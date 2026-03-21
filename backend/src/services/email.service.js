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
      }),
    );
  }

  return transporterPromise;
}

export async function sendOtpEmail(email, otpCode) {
  const transporter = await getTransporter();

  if (!transporter) {
    if (env.nodeEnv === "development") {
      console.log(`[OTP][DEV] ${email}: ${otpCode}`);
      return { delivered: false, preview: otpCode };
    }

    return { delivered: false };
  }

  await transporter.sendMail({
    from: env.smtpFrom,
    to: email,
    subject: "MixiChat OTP Verification",
    text: `Your OTP code is ${otpCode}. It will expire in ${env.otpExpiresInMinutes} minutes.`,
  });

  return { delivered: true };
}