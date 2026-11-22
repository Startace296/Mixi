import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CREDENTIAL_LABEL, getTurnCredentials, resetTurnCredentialsCache } from "../../src/lib/turn.js";

const ICE_SERVERS = [{ urls: "turn:global.relay.metered.ca:80", username: "u", credential: "p" }];

const json = (body, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

/** Fake Metered API. `existing` is what the list endpoint returns. */
function mockMetered({ existing = [], createStatus = 200 } = {}) {
  const fetchMock = vi.fn((url, init) => {
    const { pathname, searchParams } = new URL(url);
    if (pathname === "/api/v2/turn/credentials") return json({ data: existing });
    if (pathname === "/api/v1/turn/credential" && init?.method === "POST") {
      return createStatus === 200 ? json({ apiKey: "new-key" }) : json({ message: "Maximum credential limit reached" }, createStatus);
    }
    if (pathname === "/api/v1/turn/credentials" && searchParams.get("apiKey")) return json(ICE_SERVERS);
    return json({ error: "unexpected" }, 404);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const created = (fetchMock) => fetchMock.mock.calls.filter(([, init]) => init?.method === "POST");
const apiKeyUsed = (fetchMock) =>
  fetchMock.mock.calls.map(([url]) => new URL(url).searchParams.get("apiKey")).find(Boolean);

beforeEach(() => {
  process.env.METERED_DOMAIN = "mixi.metered.live";
  process.env.METERED_SECRET_KEY = "secret";
  resetTurnCredentialsCache();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("getTurnCredentials", () => {
  it("reuses an existing credential with the app's label instead of creating one", async () => {
    const fetchMock = mockMetered({
      existing: [
        { label: "someone-else", apiKey: "other-key" },
        { label: CREDENTIAL_LABEL, apiKey: "existing-key" },
      ],
    });

    await expect(getTurnCredentials()).resolves.toEqual(ICE_SERVERS);
    expect(created(fetchMock)).toHaveLength(0);
    expect(apiKeyUsed(fetchMock)).toBe("existing-key");
  });

  it("creates a labelled credential only when none exists yet", async () => {
    const fetchMock = mockMetered({ existing: [{ label: "someone-else", apiKey: "other-key" }] });

    await expect(getTurnCredentials()).resolves.toEqual(ICE_SERVERS);
    expect(created(fetchMock)).toHaveLength(1);
    expect(JSON.parse(created(fetchMock)[0][1].body)).toEqual({ label: CREDENTIAL_LABEL });
    expect(apiKeyUsed(fetchMock)).toBe("new-key");
  });

  it("keeps working when the account is at its credential limit", async () => {
    const fetchMock = mockMetered({ existing: [{ label: CREDENTIAL_LABEL, apiKey: "existing-key" }], createStatus: 403 });

    await expect(getTurnCredentials()).resolves.toEqual(ICE_SERVERS);
    expect(created(fetchMock)).toHaveLength(0);
  });

  it("caches the ICE servers, then refreshes them after the cache expires", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const fetchMock = mockMetered({ existing: [{ label: CREDENTIAL_LABEL, apiKey: "existing-key" }] });

    await getTurnCredentials();
    await getTurnCredentials();
    expect(fetchMock).toHaveBeenCalledTimes(2); // one list + one ICE fetch

    vi.setSystemTime(Date.now() + 7 * 60 * 60 * 1000);
    await getTurnCredentials();
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("does not cache a failure", async () => {
    mockMetered({ existing: [], createStatus: 403 });
    await expect(getTurnCredentials()).rejects.toMatchObject({ statusCode: 502 });

    mockMetered({ existing: [{ label: CREDENTIAL_LABEL, apiKey: "existing-key" }] });
    await expect(getTurnCredentials()).resolves.toEqual(ICE_SERVERS);
  });

  it("fails clearly when TURN is not configured", () => {
    delete process.env.METERED_SECRET_KEY;
    expect(() => getTurnCredentials()).toThrow("TURN server is not configured");
  });
});
