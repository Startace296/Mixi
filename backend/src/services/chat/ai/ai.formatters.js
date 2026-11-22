// Turns chat messages into plain text for the AI prompt and cleans up what the AI returns.
import { censorText, containsBadWords, isCleanText } from "../../../utils/bad-words.util.js";

const MAX_LINE_LENGTH = 200;
const SAFE_REPLY_FALLBACKS = [
  "Okay, I'll get back to you soon.",
  "Thanks for letting me know!",
  "Got it, let me check and reply properly.",
];

// Trims and truncates text to a max character length with ellipsis
function clipText(text, max = MAX_LINE_LENGTH) {
  const clean = (text || "").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

// The viewer is always "bạn"; other senders are labelled so the AI can tell them apart.
function getSenderLabel(sender, isViewer) {
  if (isViewer) return "bạn";

  const displayName = sender?.displayName || "";
  const username = sender?.username || "";
  const userId = String(sender?._id || "").slice(-6);

  if (displayName && username) return `${displayName} (${username})`;
  if (displayName && userId) return `${displayName} (#${userId})`;
  if (username) return username;
  if (userId) return `User #${userId}`;
  return "Họ";
}

// Formats a single message into a readable "Name: text" line.
// Returns null for call messages and deleted messages so they can be filtered out.
function formatMessageLine(message, viewerUserId) {
  if (message.isDeleted || message.deletedAt) return null;
  if (message.type === "call") return null;

  const senderId = String(message.senderId?._id || message.senderId);
  const senderName = getSenderLabel(message.senderId, senderId === String(viewerUserId));

  if (message.type === "image") return `${senderName}: [hình ảnh]`;

  const text = clipText(message.text);
  if (!text) return null;
  return `${senderName}: ${text}`;
}

// Converts an array of messages into a plain-text transcript string,
// skipping calls, deleted messages, and empty lines.
export function formatTranscript(messages, viewerUserId) {
  const ordered = [...messages].reverse();
  if (!ordered.length) return "(không có tin nhắn)";

  const lines = ordered
    .map((message) => formatMessageLine(message, viewerUserId))
    .filter(Boolean);

  return lines.length ? lines.join("\n") : "(không có tin nhắn hợp lệ)";
}

// Clips and censors a single style-sample message text
function sanitizeStyleSample(text) {
  const clipped = clipText(text, 120);
  if (!clipped) return "";
  return containsBadWords(clipped) ? censorText(clipped) : clipped;
}

// Formats viewer's past messages into a numbered list for AI style context
export function formatStyleSamples(messages) {
  const samples = messages
    .map((message) => sanitizeStyleSample(message.text))
    .filter(Boolean)
    .reverse();

  if (!samples.length) return "(no prior text messages from viewer in this chat)";

  return samples.map((line, index) => `${index + 1}. ${line}`).join("\n");
}

// Censors an AI-generated reply and returns null if it still contains bad words
function sanitizeAiReply(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) return null;

  const censored = censorText(trimmed);
  return isCleanText(censored) ? censored : null;
}

// Sanitizes AI replies, deduplicates them, and pads with fallbacks to ensure 3 results
export function buildSafeReplies(rawReplies) {
  const cleaned = rawReplies
    .map((item) => sanitizeAiReply(item))
    .filter(Boolean);

  const unique = [...new Set(cleaned)];
  for (const fallback of SAFE_REPLY_FALLBACKS) {
    if (unique.length >= 3) break;
    if (!unique.includes(fallback)) unique.push(fallback);
  }

  return unique.slice(0, 3);
}

/** Keeps the non-empty strings of an AI JSON array field (non-arrays become []). */
export function pickStrings(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string" && item.trim())
    : [];
}
