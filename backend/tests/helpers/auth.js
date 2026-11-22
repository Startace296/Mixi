import request from "supertest";

import app from "../../src/app.js";
import { sendOtpEmail } from "../../src/lib/mailer.js";

export const api = () => request(app);

export const DEFAULT_PASSWORD = "Password123!";

/** The OTP that the (mocked) email service was last asked to send. */
export function lastSentOtp() {
  const calls = sendOtpEmail.mock.calls;
  return calls[calls.length - 1]?.[1];
}

/** Runs the full signup flow (request OTP -> verify -> complete) and returns { token, user }. */
export async function registerUser({
  email = `user${Date.now()}${Math.random().toString(16).slice(2, 6)}@example.com`,
  password = DEFAULT_PASSWORD,
  displayName = "Test User",
} = {}) {
  await api().post("/auth/request-signup-otp").send({ email }).expect(201);
  const verifyRes = await api().post("/auth/verify-otp").send({ email, otpCode: lastSentOtp() }).expect(200);
  const { registrationToken } = verifyRes.body;
  const res = await api()
    .post("/auth/complete-registration")
    .send({ email, registrationToken, password, displayName, gender: "Male", day: 1, month: 1, year: 2000 })
    .expect(200);

  return { token: res.body.token, user: res.body.user, email, password };
}

export const bearer = (token) => ({ Authorization: `Bearer ${token}` });
