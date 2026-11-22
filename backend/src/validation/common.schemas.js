import mongoose from "mongoose";
import { z } from "zod";

/** A string that is a valid MongoDB ObjectId. */
export function objectIdSchema(message = "Invalid id") {
  return z
    .string({ required_error: message, invalid_type_error: message })
    .trim()
    .refine((value) => mongoose.Types.ObjectId.isValid(value), message);
}
