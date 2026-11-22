import mongoose from "mongoose";

import { AppError } from "./app-error.js";

/** Turns an ObjectId, a populated document or a plain id into its string form. */
export function toIdString(value) {
  return String(value?._id || value || "");
}

/** Throws 400 if value is not a valid MongoDB ObjectId. */
export function assertObjectId(value, message = "Invalid id") {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(message, 400);
  }
}
