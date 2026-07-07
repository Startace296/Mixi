import { AppError } from "../utils/app-error.js";

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
    throw new AppError("TURN server is not configured on the server", 500);
  }

  iceServersPromise = createCredential(domain, secretKey)
    .then((apiKey) => fetchIceServers(domain, apiKey))
    .catch((error) => {
      iceServersPromise = null;
      throw error;
    });

  return iceServersPromise;
}
