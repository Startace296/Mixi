import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";

import { api, bearer, registerUser } from "../helpers/auth.js";

describe("requireAuth middleware (GET /users/me)", () => {
  it("returns 401 without an Authorization header", async () => {
    await api().get("/users/me").expect(401);
  });

  it("returns 401 for a token signed with another secret", async () => {
    const forged = jwt.sign({ sub: "507f1f77bcf86cd799439011" }, "attacker-secret");
    await api().get("/users/me").set(bearer(forged)).expect(401);
  });

  it("returns 401 for an expired token", async () => {
    const expired = jwt.sign({ sub: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET, { expiresIn: -10 });
    await api().get("/users/me").set(bearer(expired)).expect(401);
  });

  it("returns the current user for a valid token", async () => {
    const { token, email } = await registerUser();
    const res = await api().get("/users/me").set(bearer(token)).expect(200);
    expect(JSON.stringify(res.body)).toContain(email);
  });
});

describe("unknown routes", () => {
  it("return 404 JSON", async () => {
    const res = await api().get("/does-not-exist").expect(404);
    expect(res.body.message).toMatch(/not found/i);
  });
});
