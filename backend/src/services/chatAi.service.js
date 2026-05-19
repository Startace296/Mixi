import mongoose from "mongoose";

import { generateGeminiJson } from "../lib/gemini.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { AppError } from "../utils/app-error.js";
import { censorText, containsBadWords, isCleanText } from "../utils/bad-words.util.js";

const MAX_BATCH_MESSAGES = 50;
const STYLE_SAMPLE_COUNT = 15;
const MAX_LINE_LENGTH = 200;
const SAFE_REPLY_FALLBACKS = [
  "Okay, I'll get back to you soon.",
  "Thanks for letting me know!",
  "Got it, let me check and reply properly.",
];

function assertObjectId(value, message = "Invalid id") {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(message, 400);
  }
}

function isParticipant(conversation, userId) {
  const currentId = String(userId);
  return conversation.participantIds.some(
    (participantId) => String(participantId._id || participantId) === currentId,
  );
}

async function assertParticipant(conversationId, viewerUserId) {
  assertObjectId(conversationId, "Invalid conversation id");

  const conversation = await Conversation.findById(conversationId).select("participantIds");
  if (!conversation || !isParticipant(conversation, viewerUserId)) {
    throw new AppError("Conversation not found", 404);
  }

  return conversation;
}

function clipText(text, max = MAX_LINE_LENGTH) {
  const clean = (text || "").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

function formatMessageLine(message, viewerUserId) {
  const senderId = String(message.senderId?._id || message.senderId);
  const senderName = message.senderId?.displayName
    || (senderId === String(viewerUserId) ? "You" : "Them");

  if (message.type === "image") return `${senderName}: [image]`;
  if (message.type === "call") return `${senderName}: [call]`;

  const text = clipText(message.text);
  return `${senderName}: ${text || "[empty]"}`;
}

function formatTranscript(messages, viewerUserId) {
  const ordered = [...messages].reverse();
  if (!ordered.length) return "(no messages in this batch)";

  return ordered.map((message) => formatMessageLine(message, viewerUserId)).join("\n");
}

async function getUnreadBatchMessages(conversationId, endMessageId, maxMessages) {
  assertObjectId(endMessageId, "Invalid endMessageId");

  const limit = Math.min(Math.max(Number(maxMessages) || 30, 1), MAX_BATCH_MESSAGES);
  const endMessage = await Message.findOne({
    _id: endMessageId,
    conversationId,
    deletedAt: null,
  });

  if (!endMessage) {
    throw new AppError("Invalid snapshot cursor", 400);
  }

  return Message.find({
    conversationId,
    deletedAt: null,
    createdAt: { $lte: endMessage.createdAt },
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("senderId", "displayName");
}

async function getViewerStyleMessages(conversationId, viewerUserId, styleLimit = STYLE_SAMPLE_COUNT) {
  const viewerId = new mongoose.Types.ObjectId(viewerUserId);

  return Message.find({
    conversationId,
    senderId: viewerId,
    type: "text",
    deletedAt: null,
    text: { $nin: ["", null] },
  })
    .sort({ createdAt: -1 })
    .limit(styleLimit)
    .select("text createdAt");
}

function sanitizeStyleSample(text) {
  const clipped = clipText(text, 120);
  if (!clipped) return "";
  return containsBadWords(clipped) ? censorText(clipped) : clipped;
}

function formatStyleSamples(messages) {
  const samples = messages
    .map((message) => sanitizeStyleSample(message.text))
    .filter(Boolean)
    .reverse();

  if (!samples.length) return "(no prior text messages from viewer in this chat)";

  return samples.map((line, index) => `${index + 1}. ${line}`).join("\n");
}

function sanitizeAiReply(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) return null;

  const censored = censorText(trimmed);
  return isCleanText(censored) ? censored : null;
}

function buildSafeReplies(rawReplies) {
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

export async function summarizeUnreadBatch(viewerUserId, conversationId, { endMessageId, maxMessages = 30 }) {
  await assertParticipant(conversationId, viewerUserId);

  const batch = await getUnreadBatchMessages(conversationId, endMessageId, maxMessages);
  const transcript = formatTranscript(batch, viewerUserId);

  const data = await generateGeminiJson({
    system: [
      "You summarize a chat transcript for the reader.",
      "Reply with JSON only: { \"bullets\": string[] }.",
      "Use 3-6 short bullets in the same language as the chat.",
      "Do not invent facts that are not in the transcript.",
    ].join(" "),
    user: `Transcript:\n${transcript}`,
  });

  const bullets = Array.isArray(data.bullets)
    ? data.bullets.filter((item) => typeof item === "string" && item.trim())
    : [];

  if (!bullets.length) {
    throw new AppError("AI returned an empty summary", 500);
  }

  return {
    bullets,
    meta: { endMessageId, messageCount: batch.length },
  };
}

export async function suggestRepliesForUnreadBatch(
  viewerUserId,
  conversationId,
  { endMessageId, maxMessages = 30 },
) {
  await assertParticipant(conversationId, viewerUserId);

  const batch = await getUnreadBatchMessages(conversationId, endMessageId, maxMessages);
  const styleMessages = await getViewerStyleMessages(conversationId, viewerUserId, STYLE_SAMPLE_COUNT);
  const transcript = formatTranscript(batch, viewerUserId);
  const styleSamples = formatStyleSamples(styleMessages);

  const data = await generateGeminiJson({
    system: [
      "You suggest reply options for a chat app user.",
      "Reply with JSON only: { \"replies\": [string, string, string] }.",
      "Exactly 3 short, natural replies.",
      "Read the viewer's past messages in THIS conversation to learn how they usually write",
      "(language, length, slang, emoji, punctuation, formality).",
      "Each suggestion must sound like the viewer typed it, while answering the unread context.",
      "Keep replies polite and clean: no profanity, slurs, hate, or sexual content.",
      "Do not invent facts outside the context.",
    ].join(" "),
    user: [
      "Unread messages to reply to:",
      transcript,
      "",
      `Viewer's last ${styleMessages.length} messages in this chat (writing style reference):`,
      styleSamples,
    ].join("\n"),
  });

  const rawReplies = Array.isArray(data.replies)
    ? data.replies.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim())
    : [];

  const replies = buildSafeReplies(rawReplies);

  return {
    replies,
    meta: {
      endMessageId,
      messageCount: batch.length,
      styleSampleCount: styleMessages.length,
    },
  };
}
