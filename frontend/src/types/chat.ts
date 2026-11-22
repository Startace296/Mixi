import type { Id, ISODateString } from './common';
import type { User } from './user';

export type PresenceStatus = 'online' | 'away' | 'offline';

export type MessageType = 'text' | 'image' | 'call';
export type CallMode = 'voice' | 'video';
export type CallStatus = 'cancelled' | 'declined' | 'missed' | 'ended';

/** Call log attached to a `type: 'call'` message. */
export interface CallInfo {
  callId: string;
  mode: CallMode;
  status: CallStatus;
  durationSeconds: number;
  startedAt: ISODateString | null;
  endedAt: ISODateString | null;
}

/** sanitizeMessage() in backend/src/services/chat/chat.mapper.js. `_id` and `id` are the same value. */
export interface Message {
  _id: Id;
  id: Id;
  conversationId: Id;
  senderId: Id;
  senderName: string;
  senderAvatar: string;
  /** Empty when the message is deleted. */
  text: string;
  type: MessageType;
  /** Empty when the message is deleted or has no image. */
  imageUrl: string;
  call: CallInfo | null;
  isDeleted: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  /** Opaque keyset position in the timeline; send it back as `before` / `after`. */
  cursor?: string | null;
  /** Idempotency key the sender's client chose; matches the pending copy to the real one. */
  clientMessageId?: string | null;
}

/** A message in local UI state: optimistic ones are shown before the server confirms them. */
export interface ChatMessage extends Message {
  _optimistic?: boolean;
  /** Pending message whose last send attempt failed; it can be retried or discarded. */
  _failed?: boolean;
}

export type ConversationType = 'direct' | 'group';

/**
 * One member's delivery / read watermark on the conversation timeline. A message is
 * delivered to (read by) the member iff its (createdAt, _id) key is <= the watermark.
 */
export interface MessageReceipt {
  userId: Id;
  deliveredAt: ISODateString | null;
  deliveredMessageId: Id | null;
  readAt: ISODateString | null;
  readMessageId: Id | null;
}

/** Status of a message I sent, as the ticks show it. */
export type OutgoingMessageStatus = 'failed' | 'sending' | 'sent' | 'delivered' | 'read';

/**
 * sanitizeConversation(): a conversation as seen by the current user.
 * For a direct chat, name/avatar/presence are the other user's.
 */
export interface Conversation {
  id: Id;
  conversationId: Id;
  type: ConversationType;
  name: string;
  profilePic: string;
  avatarUrl: string;
  /** The other user in a direct chat; null for groups. */
  friendId: Id | null;
  ownerId: Id | null;
  /** Empty string for groups. */
  presenceStatus: PresenceStatus | '';
  lastActiveAt: ISODateString | null;
  participants: User[];
  members: User[];
  memberCount: number;
  preview: string;
  lastMessageSenderId: Id | null;
  time: ISODateString | null;
  unread: number;
  /** Every member's watermark (the current user's included). */
  receipts?: MessageReceipt[];
  lastMessageAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** `meta` returned by the AI summarize / suggest-replies endpoints. */
export interface ChatAiMeta {
  endMessageId: Id;
  messageCount: number;
  styleSampleCount?: number;
}
