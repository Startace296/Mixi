/** Returns the trimmed string, or "" when the value is not a string. */
export function toTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}
