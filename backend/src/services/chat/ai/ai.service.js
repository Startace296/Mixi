// AI helpers in a conversation: summarize a range of messages, suggest replies.
import mongoose from "mongoose";

import { generateGeminiJson } from "../../../lib/gemini.js";
import Message from "../../../models/Message.js";
import { AppError } from "../../../utils/app-error.js";
import { assertObjectId } from "../../../utils/id.utils.js";
import { getParticipantConversation } from "../chat.guards.js";
import { buildSafeReplies, formatStyleSamples, formatTranscript, pickStrings } from "./ai.formatters.js";
import {
  buildSuggestRepliesUserPrompt,
  SUGGEST_REPLIES_SYSTEM_PROMPT,
  SUMMARY_SYSTEM_PROMPT,
} from "./ai.prompts.js";

const MAX_BATCH_MESSAGES = 50;
const DEFAULT_BATCH_MESSAGES = 30;
const STYLE_SAMPLE_COUNT = 15;
const SENDER_FIELDS = "displayName username";

async function findLiveMessage(conversationId, messageId, errorMessage) {
  const message = await Message.findOne({ _id: messageId, conversationId, deletedAt: null });
  if (!message) {
    throw new AppError(errorMessage, 400);
  }
  return message;
}

// Fetches messages between startMessage and endMessage (inclusive), or up to N messages up to endMessage
async function getMessagesBatch(conversationId, endMessageId, maxMessages, startMessageId) {
  assertObjectId(endMessageId, "Invalid endMessageId");
  const endMessage = await findLiveMessage(conversationId, endMessageId, "Invalid snapshot cursor");

  // Mode: from startMessage to endMessage
  if (startMessageId) {
    assertObjectId(startMessageId, "Invalid startMessageId");
    const startMessage = await findLiveMessage(conversationId, startMessageId, "Invalid start message");

    return Message.find({
      conversationId,
      deletedAt: null,
      createdAt: {
        $gte: startMessage.createdAt,
        $lte: endMessage.createdAt,
      },
    })
      .sort({ createdAt: 1 })
      .limit(MAX_BATCH_MESSAGES)
      .populate("senderId", SENDER_FIELDS);
  }

  // Old mode: fetch up to N messages before endMessage
  const limit = Math.min(Math.max(Number(maxMessages) || DEFAULT_BATCH_MESSAGES, 1), MAX_BATCH_MESSAGES);
  return Message.find({
    conversationId,
    deletedAt: null,
    createdAt: { $lte: endMessage.createdAt },
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("senderId", SENDER_FIELDS);
}

// Fetches recent text messages sent by the viewer to use as writing style reference
async function getViewerStyleMessages(conversationId, viewerUserId, styleLimit = STYLE_SAMPLE_COUNT) {
  return Message.find({
    conversationId,
    senderId: new mongoose.Types.ObjectId(viewerUserId),
    type: "text",
    deletedAt: null,
    text: { $nin: ["", null] },
  })
    .sort({ createdAt: -1 })
    .limit(styleLimit)
    .select("text createdAt");
}

// Summarizes a batch of messages into 2-5 bullet points using Gemini AI
export async function summarizeMessageBatch(
  viewerUserId,
  conversationId,
  { endMessageId, maxMessages = DEFAULT_BATCH_MESSAGES, startMessageId },
) {
  await getParticipantConversation(conversationId, viewerUserId, "participantIds");

  const batch = await getMessagesBatch(conversationId, endMessageId, maxMessages, startMessageId);
  const transcript = formatTranscript(batch, viewerUserId);

  const data = await generateGeminiJson({
    system: SUMMARY_SYSTEM_PROMPT,
    user: `Transcript:\n${transcript}`,
  });

  const bullets = pickStrings(data.bullets).slice(0, 5);
  if (!bullets.length) {
    throw new AppError("AI returned an empty summary", 500);
  }

  return {
    bullets,
    meta: { endMessageId, messageCount: batch.length },
  };
}

// Suggests 3 context-aware reply options that match the viewer's writing style using Gemini AI
export async function suggestRepliesForMessageBatch(
  viewerUserId,
  conversationId,
  { endMessageId, maxMessages = DEFAULT_BATCH_MESSAGES, startMessageId },
) {
  await getParticipantConversation(conversationId, viewerUserId, "participantIds");

  const batch = await getMessagesBatch(conversationId, endMessageId, maxMessages, startMessageId);
  const styleMessages = await getViewerStyleMessages(conversationId, viewerUserId, STYLE_SAMPLE_COUNT);
  const transcript = formatTranscript(batch, viewerUserId);
  const styleSamples = formatStyleSamples(styleMessages);

  const data = await generateGeminiJson({
    system: SUGGEST_REPLIES_SYSTEM_PROMPT,
    user: buildSuggestRepliesUserPrompt(transcript, styleMessages.length, styleSamples),
  });

  const replies = buildSafeReplies(pickStrings(data.replies).map((item) => item.trim()));

  return {
    replies,
    meta: {
      endMessageId,
      messageCount: batch.length,
      styleSampleCount: styleMessages.length,
    },
  };
}
