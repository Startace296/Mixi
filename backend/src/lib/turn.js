import { AppError } from "../utils/app-error.js";

export async function getTurnCredentials() {
  const domain = process.env.METERED_DOMAIN;
  const apiKey = process.env.METERED_API_KEY;

  if (!domain || !apiKey) {
    throw new AppError("TURN server is not configured on the server", 500);
  }

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
