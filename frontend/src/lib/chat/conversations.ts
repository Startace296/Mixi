import { mergeReceipts } from './receipts';
import type { Conversation, Id } from '../../types';

/**
 * Applies a newer copy of a conversation over the one held. Receipts are merged by
 * furthest watermark rather than replaced: a payload built before a receipt event we
 * already applied must not move the ticks backwards.
 */
export function mergeConversation(existing: Conversation | undefined, incoming: Conversation): Conversation {
  if (!existing) return incoming;
  return {
    ...existing,
    ...incoming,
    receipts: mergeReceipts(existing.receipts, incoming.receipts),
  };
}

/** A freshly fetched list, keeping receipts at least as far as the ones already held. */
export function mergeConversationList(existing: Conversation[], incoming: Conversation[]): Conversation[] {
  const byId = new Map(existing.map((conversation) => [conversation.id, conversation]));
  return incoming.map((conversation) => mergeConversation(byId.get(conversation.id), conversation));
}

type SortableConversation = Partial<Pick<Conversation, 'time' | 'lastMessageAt' | 'updatedAt'>>;

export function getConversationSortTime(conversation: SortableConversation | null | undefined): number {
  return new Date(
    conversation?.time || conversation?.lastMessageAt || conversation?.updatedAt || 0,
  ).getTime();
}

export function formatConversationPreview(
  chat: Pick<Conversation, 'preview' | 'lastMessageSenderId'>,
  currentUserId: Id | null | undefined,
): string {
  const previewText = (chat.preview || "").trim();
  if (!previewText || previewText === "No messages yet") return "No messages yet.";
  if (previewText === "This message was deleted") return previewText;
  if (
    chat.lastMessageSenderId
    && currentUserId
    && String(chat.lastMessageSenderId) === String(currentUserId)
  ) {
    return `You: ${previewText}`;
  }
  return previewText;
}
