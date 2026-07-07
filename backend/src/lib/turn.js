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

export async function getTurnCredentials() {
  const domain = process.env.METERED_DOMAIN;
  const apiKey = process.env.METERED_API_KEY;

  // Try Metered API first if configured
  if (domain && apiKey) {
    try {
      const url = `https://${domain}/api/v1/turn/credentials?apiKey=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url);
      if (response.ok) {
        return response.json();
      }
      console.warn("[TURN] Metered API returned", response.status, "— falling back to free TURN servers");
    } catch (error) {
      console.warn("[TURN] Could not reach Metered API:", error.message, "— falling back to free TURN servers");
    }
  }

  // Fallback: return free public TURN servers
  return FREE_TURN_SERVERS;
}
