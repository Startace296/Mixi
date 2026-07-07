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

async function getMeteredIceServers(domain, secretKey) {
  // Step 1: GET v2/credentials to list existing credentials
  const listUrl = `https://${domain}/api/v2/turn/credentials?secretKey=${encodeURIComponent(secretKey)}`;
  const listResponse = await fetch(listUrl);

  if (!listResponse.ok) {
    throw new Error(`Metered v2 credentials list failed: ${listResponse.status}`);
  }

  const { data } = await listResponse.json();
  if (!data || data.length === 0) {
    throw new Error("No Metered credentials found");
  }

  // Step 2: GET v1/credentials to get ICE server URLs using the first credential's apiKey
  const apiKey = data[0].apiKey;
  const iceUrl = `https://${domain}/api/v1/turn/credentials?apiKey=${encodeURIComponent(apiKey)}`;
  const iceResponse = await fetch(iceUrl);

  if (!iceResponse.ok) {
    throw new Error(`Metered ICE fetch failed: ${iceResponse.status}`);
  }

  return iceResponse.json();
}

export function getTurnCredentials() {
  if (iceServersPromise) return iceServersPromise;

  const domain = process.env.METERED_DOMAIN;
  const secretKey = process.env.METERED_SECRET_KEY;

  if (!domain || !secretKey) {
    console.warn("[TURN] METERED_DOMAIN or METERED_SECRET_KEY not set — using free TURN servers");
    return Promise.resolve(FREE_TURN_SERVERS);
  }

  iceServersPromise = getMeteredIceServers(domain, secretKey)
    .then((iceServers) => {
      console.log("[TURN] Metered ICE servers fetched successfully, count:", iceServers.length);
      return iceServers;
    })
    .catch((error) => {
      console.warn("[TURN] Metered API failed:", error.message, "— falling back to free TURN servers");
      iceServersPromise = null;
      return FREE_TURN_SERVERS;
    });

  return iceServersPromise;
}
