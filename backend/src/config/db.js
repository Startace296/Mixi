import mongoose from "mongoose";

import { env } from "./env.js";
import User from "../models/User.js";

export async function connectDatabase() {
  if (!env.mongoUri) {
    throw new Error("MONGODB_URI is required");
  }

  const connection = await mongoose.connect(env.mongoUri);
  await User.syncIndexes();

  console.log(
    `MongoDB connected: ${connection.connection.host}/${connection.connection.name}`,
  );
  console.log("MongoDB indexes synced for User model");
}
