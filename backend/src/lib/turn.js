import { AppError } from "../utils/app-error.js";

const FREE_TURN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

let iceServersPromise = null;

async function createCredential(domain, secretKey) {
  const url = `https://${domain}/api/v1/turn/credential?secretKey=${encodeURIComponent(secretKey)}`;

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: "mixi-voice-call" }),
    });
  } catch (error) {
    console.error("Metered TURN credential creation failed:", error);
    throw new AppError("Could not reach TURN server", 502);
  }

  if (!response.ok) {
    console.error("Metered TURN credential creation failed:", response.status, await response.text());
    throw new AppError("Could not create TURN credentials", 502);
  }

  const { apiKey } = await response.json();
  return apiKey;
}

async function fetchIceServers(domain, apiKey) {
  const url = `https://${domain}/api/v1/turn/credentials?apiKey=${encodeURIComponent(apiKey)}`;

  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    console.error("Metered TURN request failed:", error);
    throw new AppError("Could not reach TURN server", 502);
  }

  if (!response.ok) {
    console.error("Metered TURN request failed:", response.status, await response.text());
    throw new AppError("Could not fetch TURN credentials", 502);
  }

  return response.json();
}

export function getTurnCredentials() {
  if (iceServersPromise) return iceServersPromise;

  const domain = process.env.METERED_DOMAIN;
  const secretKey = process.env.METERED_SECRET_KEY;

  if (!domain || !secretKey) {
    console.warn("[TURN] METERED_DOMAIN or METERED_SECRET_KEY not configured — using free TURN servers");
    return Promise.resolve(FREE_TURN_SERVERS);
  }

  iceServersPromise = createCredential(domain, secretKey)
    .then((apiKey) => fetchIceServers(domain, apiKey))
    .catch((error) => {
      console.warn("[TURN] Metered API failed:", error.message, "— falling back to free TURN servers");
      iceServersPromise = null;
      return FREE_TURN_SERVERS;
    });

  return iceServersPromise;
}
