import { AppError } from "../utils/app-error.js";

// Metered's free plan allows only a few credentials per account, and credentials are
// never deleted, so the backend must reuse one instead of creating a new one per start.
// Every credential this app creates carries this label.
export const CREDENTIAL_LABEL = "mixi-voice-call";

// Re-read the ICE servers now and then, so a credential deleted in the Metered
// dashboard is noticed without restarting the backend.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

let cache = null; // { promise, expiresAt }

async function meteredRequest(url, init, failureMessage) {
  let response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    console.error(`${failureMessage}:`, error);
    throw new AppError("Could not reach TURN server", 502);
  }

  if (!response.ok) {
    console.error(`${failureMessage}:`, response.status, await response.text());
    throw new AppError(failureMessage, 502);
  }

  return response.json();
}

async function findExistingApiKey(domain, secretKey) {
  const url = `https://${domain}/api/v2/turn/credentials?secretKey=${encodeURIComponent(secretKey)}`;
  const body = await meteredRequest(url, undefined, "Could not list TURN credentials");
  const credentials = Array.isArray(body) ? body : body?.data ?? [];
  return credentials.find((credential) => credential.label === CREDENTIAL_LABEL && credential.apiKey)?.apiKey ?? null;
}

async function createApiKey(domain, secretKey) {
  const url = `https://${domain}/api/v1/turn/credential?secretKey=${encodeURIComponent(secretKey)}`;
  const { apiKey } = await meteredRequest(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: CREDENTIAL_LABEL }),
    },
    "Could not create TURN credentials",
  );
  return apiKey;
}

async function fetchIceServers(domain, apiKey) {
  const url = `https://${domain}/api/v1/turn/credentials?apiKey=${encodeURIComponent(apiKey)}`;
  return meteredRequest(url, undefined, "Could not fetch TURN credentials");
}

async function loadIceServers(domain, secretKey) {
  const apiKey = (await findExistingApiKey(domain, secretKey)) ?? (await createApiKey(domain, secretKey));
  return fetchIceServers(domain, apiKey);
}

export function getTurnCredentials() {
  if (cache && cache.expiresAt > Date.now()) return cache.promise;

  const domain = process.env.METERED_DOMAIN;
  const secretKey = process.env.METERED_SECRET_KEY;

  if (!domain || !secretKey) {
    throw new AppError("TURN server is not configured on the server", 500);
  }

  const entry = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    promise: loadIceServers(domain, secretKey).catch((error) => {
      if (cache === entry) cache = null;
      throw error;
    }),
  };
  cache = entry;
  return entry.promise;
}

/** Test helper: forget the cached ICE servers. */
export function resetTurnCredentialsCache() {
  cache = null;
}
