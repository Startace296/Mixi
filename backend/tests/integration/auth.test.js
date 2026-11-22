import { describe, expect, it } from "vitest";

import User from "../../src/models/User.js";
import { sendOtpEmail } from "../../src/lib/mailer.js";
import { api, bearer, DEFAULT_PASSWORD, lastSentOtp, registerUser } from "../helpers/auth.js";

describe("POST /auth/request-signup-otp", () => {
  it("creates an unverified user and emails a 6-digit OTP", async () => {
    const res = await api()
      .post("/auth/request-signup-otp")
      .send({ email: "  New@Example.com " })
      .expect(201);

    expect(res.body.user.email).toBe("new@example.com");
    expect(res.body.user.isEmailVerified).toBe(false);
    expect(sendOtpEmail).toHaveBeenCalledWith("new@example.com", expect.stringMatching(/^\d{6}$/), "signup");

    // The OTP must be stored hashed, never in plain text.
    const stored = await User.findOne({ email: "new@example.com" }).select("+otpCode");
    expect(stored.otpCode).not.toBe(lastSentOtp());
  });

  it("rejects an invalid email with 400", async () => {
    await api().post("/auth/request-signup-otp").send({ email: "not-an-email" }).expect(400);
  });

  it("rejects an email that is already registered", async () => {
    const { email } = await registerUser();
    const res = await api().post("/auth/request-signup-otp").send({ email }).expect(409);
    expect(res.body.message).toMatch(/already registered/i);
  });
});

describe("POST /auth/verify-otp", () => {
  const email = "verify@example.com";

  it("verifies the email with the correct OTP", async () => {
    await api().post("/auth/request-signup-otp").send({ email });
    const res = await api().post("/auth/verify-otp").send({ email, otpCode: lastSentOtp() }).expect(200);
    expect(res.body.user.isEmailVerified).toBe(true);
  });

  it("rejects a wrong OTP", async () => {
    await api().post("/auth/request-signup-otp").send({ email });
    const wrong = lastSentOtp() === "000000" ? "111111" : "000000";
    await api().post("/auth/verify-otp").send({ email, otpCode: wrong }).expect(400);
  });

  it("rejects an expired OTP", async () => {
    await api().post("/auth/request-signup-otp").send({ email });
    await User.updateOne({ email }, { otpExpiresAt: new Date(Date.now() - 1000) });
    const res = await api().post("/auth/verify-otp").send({ email, otpCode: lastSentOtp() }).expect(400);
    expect(res.body.message).toMatch(/expired/i);
  });

  it("cannot reuse an OTP after a successful verification", async () => {
    await api().post("/auth/request-signup-otp").send({ email });
    const otp = lastSentOtp();
    await api().post("/auth/verify-otp").send({ email, otpCode: otp }).expect(200);
    await api().post("/auth/verify-otp").send({ email, otpCode: otp }).expect(400);
  });
});

describe("POST /auth/complete-registration", () => {
  const profile = { password: DEFAULT_PASSWORD, displayName: "X", gender: "Male", day: 1, month: 1, year: 2000 };

  async function verifyEmail(email) {
    await api().post("/auth/request-signup-otp").send({ email }).expect(201);
    const res = await api().post("/auth/verify-otp").send({ email, otpCode: lastSentOtp() }).expect(200);
    return res.body.registrationToken;
  }

  it("refuses to complete registration before the email is verified", async () => {
    const email = "unverified@example.com";
    await api().post("/auth/request-signup-otp").send({ email });
    await api().post("/auth/complete-registration").send({ email, ...profile }).expect(400);
  });

  it("issues a registration token on verify-otp and stores only its hash", async () => {
    const email = "tokenhash@example.com";
    const registrationToken = await verifyEmail(email);
    expect(registrationToken).toMatch(/^[0-9a-f]{64}$/);
    const stored = await User.findOne({ email }).select("+registrationTokenHash");
    expect(stored.registrationTokenHash).toEqual(expect.any(String));
    expect(stored.registrationTokenHash).not.toBe(registrationToken);
  });

  it("rejects a verified email without a valid registration token (account takeover)", async () => {
    const email = "takeover@example.com";
    await verifyEmail(email);
    await api().post("/auth/complete-registration").send({ email, ...profile }).expect(400);
    await api()
      .post("/auth/complete-registration")
      .send({ email, registrationToken: "f".repeat(64), ...profile })
      .expect(401);
  });

  it("does not let a token for one email complete another email", async () => {
    const tokenA = await verifyEmail("a@example.com");
    await verifyEmail("b@example.com");
    await api()
      .post("/auth/complete-registration")
      .send({ email: "b@example.com", registrationToken: tokenA, ...profile })
      .expect(401);
  });

  it("cannot reuse a registration token, so a finished account cannot be overwritten", async () => {
    const email = "once@example.com";
    const registrationToken = await verifyEmail(email);
    await api().post("/auth/complete-registration").send({ email, registrationToken, ...profile }).expect(200);
    await api()
      .post("/auth/complete-registration")
      .send({ email, registrationToken, ...profile, password: "Hijacked123!" })
      .expect(401);
    await api().post("/auth/login").send({ email, password: DEFAULT_PASSWORD }).expect(200);
    await api().post("/auth/login").send({ email, password: "Hijacked123!" }).expect(401);
  });

  it("rejects an expired registration token", async () => {
    const email = "expiredtoken@example.com";
    const registrationToken = await verifyEmail(email);
    await User.updateOne({ email }, { registrationTokenExpiresAt: new Date(Date.now() - 1000) });
    await api().post("/auth/complete-registration").send({ email, registrationToken, ...profile }).expect(401);
  });

  it("invalidates the old token when a new OTP is requested", async () => {
    const email = "resend@example.com";
    const oldToken = await verifyEmail(email);
    await api().post("/auth/request-signup-otp").send({ email }).expect(201);
    await api()
      .post("/auth/complete-registration")
      .send({ email, registrationToken: oldToken, ...profile })
      .expect(401);
  });

  it("rejects users younger than 18 without consuming the token", async () => {
    const email = "kid@example.com";
    const registrationToken = await verifyEmail(email);
    const year = new Date().getFullYear() - 10;
    const res = await api()
      .post("/auth/complete-registration")
      .send({ email, registrationToken, ...profile, displayName: "Kid", year })
      .expect(400);
    expect(res.body.message).toMatch(/18/);
    await api().post("/auth/complete-registration").send({ email, registrationToken, ...profile }).expect(200);
  });

  it("validates the body before touching the token", async () => {
    const email = "invalid-body@example.com";
    const registrationToken = await verifyEmail(email);
    const send = (body) => api().post("/auth/complete-registration").send({ email, registrationToken, ...profile, ...body });

    expect((await send({ gender: "Unknown" }).expect(400)).body.message).toMatch(/gender/i);
    expect((await send({ displayName: "   " }).expect(400)).body.message).toMatch(/display name is required/i);
    expect((await send({ password: "short" }).expect(400)).body.message).toMatch(/at least 8/);
    expect((await send({ day: undefined }).expect(400)).body.message).toMatch(/date of birth is required/i);
    expect((await send({ day: 31, month: 2 }).expect(400)).body.message).toMatch(/date of birth is invalid/i);
    expect((await send({ month: 13 }).expect(400)).body.message).toMatch(/month/i);
    await send({ registrationToken: undefined }).expect(400);

    // String date parts (from form inputs) are coerced, and the token still works.
    await send({ day: "01", month: "1", year: "2000" }).expect(200);
  });

  it("returns a token and never leaks the password hash", async () => {
    const { token, user } = await registerUser();
    expect(token).toEqual(expect.any(String));
    expect(user).not.toHaveProperty("passwordHash");
    expect(user).not.toHaveProperty("otpCode");
  });
});

describe("POST /auth/login", () => {
  it("logs in with correct credentials", async () => {
    const { email, password } = await registerUser();
    const res = await api().post("/auth/login").send({ email, password }).expect(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it("returns the same 401 message for a wrong password and an unknown email", async () => {
    const { email } = await registerUser();
    const wrongPassword = await api().post("/auth/login").send({ email, password: "WrongPass1!" }).expect(401);
    const unknownEmail = await api().post("/auth/login").send({ email: "nobody@example.com", password: "x" }).expect(401);
    // Same message prevents user enumeration.
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });
});

describe("POST /auth/forgot-password/*", () => {
  it("does not reveal whether an email exists", async () => {
    const res = await api().post("/auth/forgot-password/request-otp").send({ email: "ghost@example.com" }).expect(200);
    expect(res.body.message).toMatch(/if this email exists/i);
    expect(sendOtpEmail).not.toHaveBeenCalled();
  });

  it("resets the password with a valid OTP, then the OTP is consumed", async () => {
    const { email } = await registerUser();
    await api().post("/auth/forgot-password/request-otp").send({ email }).expect(200);
    const otp = lastSentOtp();

    await api().post("/auth/forgot-password/reset").send({ email, otpCode: otp, newPassword: "BrandNew123!" }).expect(200);
    await api().post("/auth/login").send({ email, password: "BrandNew123!" }).expect(200);
    await api().post("/auth/forgot-password/reset").send({ email, otpCode: otp, newPassword: "Another123!" }).expect(400);
  });

  it("validates the reset body without spending an OTP attempt", async () => {
    const { email } = await registerUser();
    await api().post("/auth/forgot-password/request-otp").send({ email }).expect(200);
    const otp = lastSentOtp();
    const reset = (body) => api().post("/auth/forgot-password/reset").send({ email, otpCode: otp, newPassword: "BrandNew123!", ...body });

    await reset({ email: "not-an-email" }).expect(400);
    await reset({ otpCode: "12ab" }).expect(400);
    await reset({ otpCode: undefined }).expect(400);
    await reset({ newPassword: "short" }).expect(400);

    const stored = await User.findOne({ email }).select("+otpAttempts");
    expect(stored.otpAttempts || 0).toBe(0);
    await reset({}).expect(200);
  });
});

describe("POST /auth/change-password", () => {
  it("requires authentication", async () => {
    await api().post("/auth/change-password").send({ currentPassword: "a", newPassword: "12345678" }).expect(401);
  });

  it("rejects a wrong current password", async () => {
    const { token } = await registerUser();
    await api()
      .post("/auth/change-password")
      .set(bearer(token))
      .send({ currentPassword: "WrongPass1!", newPassword: "BrandNew123!" })
      .expect(400);
  });

  it("changes the password", async () => {
    const { token, email, password } = await registerUser();
    await api()
      .post("/auth/change-password")
      .set(bearer(token))
      .send({ currentPassword: password, newPassword: "BrandNew123!" })
      .expect(200);
    await api().post("/auth/login").send({ email, password }).expect(401);
    await api().post("/auth/login").send({ email, password: "BrandNew123!" }).expect(200);
  });
});

describe("OTP attempt limit", () => {
  const wrongOtp = () => (lastSentOtp() === "000000" ? "111111" : "000000");

  it("cancels the signup OTP after 5 wrong attempts, even if the correct code comes next", async () => {
    const email = "brute@example.com";
    await api().post("/auth/request-signup-otp").send({ email }).expect(201);
    const otp = lastSentOtp();

    for (let i = 0; i < 4; i++) {
      await api().post("/auth/verify-otp").send({ email, otpCode: wrongOtp() }).expect(400);
    }
    const res = await api().post("/auth/verify-otp").send({ email, otpCode: wrongOtp() }).expect(429);
    expect(res.body.message).toMatch(/too many/i);

    const stored = await User.findOne({ email }).select("+otpCode +otpExpiresAt");
    expect(stored.otpCode).toBeUndefined();
    await api().post("/auth/verify-otp").send({ email, otpCode: otp }).expect(400);
  });

  it("caps parallel guesses at 5", async () => {
    const email = "parallel@example.com";
    await api().post("/auth/request-signup-otp").send({ email }).expect(201);
    const results = await Promise.all(
      Array.from({ length: 12 }, () => api().post("/auth/verify-otp").send({ email, otpCode: wrongOtp() })),
    );
    expect(results.filter((r) => r.status === 400 && /invalid/i.test(r.body.message)).length).toBeLessThanOrEqual(4);
    const stored = await User.findOne({ email }).select("+otpCode +otpAttempts");
    expect(stored.otpCode).toBeUndefined();
    expect(stored.otpAttempts).toBe(5);
  });

  it("resets the counter when a new OTP is requested", async () => {
    const email = "retry@example.com";
    await api().post("/auth/request-signup-otp").send({ email }).expect(201);
    for (let i = 0; i < 5; i++) {
      await api().post("/auth/verify-otp").send({ email, otpCode: wrongOtp() });
    }
    await api().post("/auth/request-signup-otp").send({ email }).expect(201);
    await api().post("/auth/verify-otp").send({ email, otpCode: lastSentOtp() }).expect(200);
  });

  it("cancels the forgot-password OTP after 5 wrong reset attempts", async () => {
    const { email } = await registerUser();
    await api().post("/auth/forgot-password/request-otp").send({ email }).expect(200);
    const otp = lastSentOtp();

    for (let i = 0; i < 4; i++) {
      await api().post("/auth/forgot-password/verify-otp").send({ email, otpCode: wrongOtp() }).expect(400);
    }
    await api()
      .post("/auth/forgot-password/reset")
      .send({ email, otpCode: wrongOtp(), newPassword: "BrandNew123!" })
      .expect(429);
    await api().post("/auth/forgot-password/reset").send({ email, otpCode: otp, newPassword: "BrandNew123!" }).expect(400);
  });

  it("a correct forgot-password verify gives the reset step a fresh budget", async () => {
    const { email } = await registerUser();
    await api().post("/auth/forgot-password/request-otp").send({ email }).expect(200);
    const otp = lastSentOtp();

    for (let i = 0; i < 4; i++) {
      await api().post("/auth/forgot-password/verify-otp").send({ email, otpCode: wrongOtp() }).expect(400);
    }
    await api().post("/auth/forgot-password/verify-otp").send({ email, otpCode: otp }).expect(200);
    await api().post("/auth/forgot-password/reset").send({ email, otpCode: otp, newPassword: "BrandNew123!" }).expect(200);
  });
});
