import mongoose from "mongoose";

import { env } from "./env.js";
import User from "../models/User.js";

export async function connectDatabase() {
  if (!env.mongoUri) {
    throw new Error("MONGODB_URI is required");
  }

  // In production indexes are managed by migration scripts (src/scripts/), not by
  // every app instance at boot: building one on a large collection is slow, and
  // several instances starting together would all try.
  const connection = await mongoose.connect(env.mongoUri, {
    autoIndex: env.nodeEnv !== "production",
  });
  await User.syncIndexes();

  console.log(
    `MongoDB connected: ${connection.connection.host}/${connection.connection.name}`,
  );
  console.log("MongoDB indexes synced for User model");
}
