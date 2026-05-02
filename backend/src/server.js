import "dotenv/config";

import http from "node:http";

import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { initSocket } from "./socket.js";

const port = Number(process.env.PORT) || 5000;

async function startServer() {
  await connectDatabase();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(port, () => {
    console.log(`listening on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start backend:", error.message);
  process.exit(1);
});
