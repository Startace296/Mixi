import mongoose from "mongoose";

import { AppError } from "./app-error.js";

/** Parses a `?limit=` value, falling back to `fallback` and clamping it to [1, max]. */
export function parseLimit(rawLimit, fallback, max) {
  return Math.min(Math.max(Number.parseInt(rawLimit, 10) || fallback, 1), max);
}

/** Parses a `?before=` date cursor, throwing 400 with `message` if it is not a valid date. */
export function parseDateCursor(value, message) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(message, 400);
  }
  return date;
}

// --- Keyset cursors -------------------------------------------------------
//
// A keyset cursor names one row by its full sort key, (createdAt, _id). `createdAt`
// alone is not unique (several messages can share a millisecond), so a date-only
// cursor skips or repeats rows at page boundaries; `_id` breaks the tie.
// The cursor is opaque to clients (base64url) so its format can change later.

const KEYSET_CURSOR_PATTERN = /^(\d{1,15}):([a-f0-9]{24})$/;

export function encodeKeysetCursor(createdAt, id) {
  const time = new Date(createdAt).getTime();
  if (Number.isNaN(time) || !id) return null;
  return Buffer.from(`${time}:${String(id)}`, "utf8").toString("base64url");
}

/** Returns `{ createdAt, id }`, or null if `value` is not a keyset cursor. */
export function decodeKeysetCursor(value) {
  if (typeof value !== "string" || !value || value.length > 64) return null;

  const match = KEYSET_CURSOR_PATTERN.exec(Buffer.from(value, "base64url").toString("utf8"));
  if (!match) return null;

  const createdAt = new Date(Number(match[1]));
  if (Number.isNaN(createdAt.getTime())) return null;

  return { createdAt, id: new mongoose.Types.ObjectId(match[2]) };
}

/**
 * Mongo filter for rows strictly past `cursor` in the given direction of the
 * (createdAt, _id) order. The outer inclusive range lets the index bound the scan;
 * the $or drops the rows that share the cursor's createdAt but are not past it.
 * A cursor without an id (a legacy date cursor) compares on createdAt only.
 */
export function buildKeysetFilter(cursor, direction) {
  const strict = direction === "before" ? "$lt" : "$gt";
  if (!cursor.id) {
    return { createdAt: { [strict]: cursor.createdAt } };
  }

  const inclusive = direction === "before" ? "$lte" : "$gte";
  return {
    createdAt: { [inclusive]: cursor.createdAt },
    $or: [
      { createdAt: { [strict]: cursor.createdAt } },
      { _id: { [strict]: cursor.id } },
    ],
  };
}
