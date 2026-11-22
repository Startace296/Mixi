import { AppError } from "./app-error.js";

const MIN_AGE_YEARS = 18;

/** Throws 400 if the person born on `birthDate` is younger than 18 today. */
export function ensureAdult(birthDate) {
  const today = new Date();
  const minAllowedDate = new Date(
    today.getFullYear() - MIN_AGE_YEARS,
    today.getMonth(),
    today.getDate(),
  );

  if (birthDate > minAllowedDate) {
    throw new AppError("You must be at least 18 years old", 400);
  }
}
