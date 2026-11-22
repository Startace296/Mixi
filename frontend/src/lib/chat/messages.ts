import type { ChatMessage, Id, ISODateString, Message } from '../../types';
import { MAX_MESSAGE_PAGE_LIMIT, MESSAGE_PAGE_LIMIT } from './constants';

/**
 * Adds a message unless it is already there. A server copy of one of my pending
 * messages (same clientMessageId) takes the pending one's place instead of being
 * appended, whichever arrives first: the socket event or the HTTP response.
 */
export function appendMessageOnce(messages: ChatMessage[], nextMessage: ChatMessage | null | undefined): ChatMessage[] {
  if (!nextMessage?._id) return messages;
  if (messages.some((message) => message._id === nextMessage._id)) return messages;
  if (nextMessage.clientMessageId && !nextMessage._optimistic) {
    const pendingIndex = messages.findIndex((message) => (
      message._optimistic && message.clientMessageId === nextMessage.clientMessageId
    ));
    if (pendingIndex !== -1) {
      const next = [...messages];
      next[pendingIndex] = nextMessage;
      return next;
    }
  }
  return [...messages, nextMessage];
}

/** Random idempotency key for one outgoing message (matches the server's [A-Za-z0-9_-]{8,64}). */
export function createClientMessageId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  // randomUUID needs a secure context; fall back to random bytes elsewhere.
  const bytes = new Uint8Array(16);
  if (cryptoApi?.getRandomValues) cryptoApi.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function getMessageDayKey(createdAt: ISODateString | Date): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function getDeletedMessagePatch(messageId: Id): (message: Message) => Message {
  return (message) => (
    message._id === messageId
      ? { ...message, text: "", imageUrl: "", isDeleted: true }
      : message
  );
}

/** Blanks every message whose id is in `deletedIds`, the way a delete event would. */
export function applyDeletedMessageIds(messages: ChatMessage[], deletedIds: Id[] | null | undefined): ChatMessage[] {
  if (!deletedIds?.length) return messages;
  const deleted = new Set(deletedIds.map(String));
  let changed = false;
  const next = messages.map((message) => {
    if (message.isDeleted || !deleted.has(String(message._id))) return message;
    changed = true;
    return { ...message, text: "", imageUrl: "", call: null, isDeleted: true };
  });
  return changed ? next : messages;
}

export function mergeOlderMessages(prevMessages: Message[], olderMessages: Message[]): Message[] {
  const existingIds = new Set(prevMessages.map((message) => message._id));
  return [
    ...olderMessages.filter((message) => !existingIds.has(message._id)),
    ...prevMessages,
  ];
}

/**
 * Appends a catch-up page (messages newer than what is shown). Messages still being
 * sent stay last, so a pending bubble never ends up above messages that arrived first.
 */
export function mergeNewerMessages(prevMessages: ChatMessage[], newerMessages: Message[]): ChatMessage[] {
  if (!newerMessages.length) return prevMessages;

  const confirmed = prevMessages.filter((message) => !message._optimistic);
  const pending = prevMessages.filter((message) => message._optimistic);
  const existingIds = new Set(confirmed.map((message) => message._id));

  return [
    ...confirmed,
    ...newerMessages.filter((message) => !existingIds.has(message._id)),
    ...pending,
  ];
}

/**
 * Installs a freshly loaded newest page as the whole timeline. Anything already held
 * that is newer than the page (live socket messages that raced the request) or still
 * being sent is kept after it; everything older is dropped, because the gap between it
 * and the page is unknown.
 */
export function replaceWithLatestPage(currentMessages: ChatMessage[], pageMessages: Message[]): ChatMessage[] {
  const pageNewestTime = pageMessages.length
    ? new Date(pageMessages[pageMessages.length - 1].createdAt).getTime()
    : Number.NEGATIVE_INFINITY;
  const keptMessages = currentMessages.filter((message) => (
    message._optimistic || new Date(message.createdAt).getTime() > pageNewestTime
  ));
  return mergeNewerMessages(pageMessages, keptMessages);
}

/** Cursor of the newest message the server has confirmed, the starting point for a catch-up. */
export function getNewestCursor(messages: ChatMessage[]): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message._optimistic && message.cursor) return message.cursor;
  }
  return null;
}

/**
 * Size of the first page when opening a chat: big enough to hold every unread message
 * plus a little context, so the "N unread messages" marker can be placed right away.
 */
export function getInitialPageLimit(unreadCount: number | null | undefined): number {
  const wanted = Math.max(MESSAGE_PAGE_LIMIT, (unreadCount || 0) + 10);
  return Math.min(wanted, MAX_MESSAGE_PAGE_LIMIT);
}
