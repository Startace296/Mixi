/**
 * Lightweight profanity filter for AI-generated chat replies.
 * Not exhaustive — blocks common English/Vietnamese slurs before they reach the client.
 */

const BAD_WORDS = [
  "fuck", "fucking", "fucker", "motherfucker",
  "shit", "bullshit", "bitch", "bastard", "asshole", "dick", "pussy", "cunt",
  "whore", "slut", "nigger", "nigga", "faggot", "retard",
  "địt", "dit", "đụ", "du", "lồn", "lon", "cặc", "cac", "buồi", "buoi",
  "đéo", "deo", "đĩ", "di", "clgt", "clmm", "vcl", "vl", "đm", "dm",
  "cc", "cmm", "đcm", "dcm", "shit", "fck", "fuk",
];

const BAD_WORD_REGEXES = BAD_WORDS.map((word) => {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^\\p{L}\\p{N}_])(${escaped})(?=[^\\p{L}\\p{N}_]|$)`, "iu");
});

const REPLACEMENT = "***";

export function containsBadWords(text) {
  if (!text || typeof text !== "string") return false;
  return BAD_WORD_REGEXES.some((regex) => regex.test(text));
}

export function censorText(text) {
  if (!text || typeof text !== "string") return "";

  let censored = text;
  for (const regex of BAD_WORD_REGEXES) {
    censored = censored.replace(regex, (match, word) => match.replace(word, REPLACEMENT));
  }
  return censored.replace(/\s{2,}/g, " ").trim();
}

export function isCleanText(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) return false;
  return !containsBadWords(trimmed) && !trimmed.includes(REPLACEMENT);
}
