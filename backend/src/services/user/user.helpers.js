import { AppError } from "../../utils/app-error.js";
import { ensureAdult } from "../../utils/date-of-birth.utils.js";

const MAX_BIO_CHARACTERS = 280;
const MAX_BIO_LINES = 4;

export function parseDateOfBirth(dateOfBirth) {
  const birthDate = new Date(dateOfBirth);

  if (Number.isNaN(birthDate.getTime())) {
    throw new AppError("Date of birth is invalid", 400);
  }

  ensureAdult(birthDate);
  return birthDate;
}

export function normalizeBio(bio) {
  const value = typeof bio === "string" ? bio.trim() : "";

  if (!value) return "";

  if (value.length > MAX_BIO_CHARACTERS) {
    throw new AppError(`Bio must be at most ${MAX_BIO_CHARACTERS} characters long`, 400);
  }

  const lineCount = value.replace(/\r\n?/g, "\n").split("\n").length;
  if (lineCount > MAX_BIO_LINES) {
    throw new AppError(`Bio must be at most ${MAX_BIO_LINES} lines long`, 400);
  }

  return value;
}

/** How `currentUserId` relates to the other user of a FriendRequest: friends / requested / incoming. */
export function getRelationshipStatus(relation, currentUserId) {
  if (relation.status === "accepted") return "friends";
  return String(relation.requestedById) === String(currentUserId) ? "requested" : "incoming";
}
