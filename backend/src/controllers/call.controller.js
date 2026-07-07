import { getTurnCredentials } from "../lib/turn.js";

export async function getTurnCredentialsHandler(_req, res) {
  const iceServers = await getTurnCredentials();
  res.json({ iceServers });
}
