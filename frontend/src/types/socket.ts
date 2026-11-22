import type { Id, ISODateString } from './common';
import type { Conversation, Message, MessageReceipt, PresenceStatus } from './chat';

/** Server -> client `presence:changed`. */
export interface PresenceChangedPayload {
  userId: Id;
  status: PresenceStatus;
  lastActiveAt: ISODateString | null;
}

/** Server -> client `chat:typing`. */
export interface ChatTypingPayload {
  conversationId: Id;
  userId: Id;
  isTyping: boolean;
  changedAt: ISODateString;
}

/** Server -> client `chat:message_created` / `chat:message_deleted`. */
export interface ChatMessageEventPayload {
  conversationId: Id;
  message: Message;
  conversation: Conversation | null;
  changedAt: ISODateString;
}

/** Server -> client `chat:conversation_read`. */
export interface ChatConversationReadPayload {
  conversationId: Id;
  userId: Id;
  conversation: Conversation | null;
  changedAt: ISODateString;
}

/** Server -> client `chat:receipt_updated`: one member's watermarks moved forward. */
export interface ChatReceiptUpdatedPayload {
  conversationId: Id;
  receipt: MessageReceipt;
  changedAt: ISODateString;
}

/** Server -> client `chat:conversation_updated`. */
export interface ChatConversationUpdatedPayload {
  conversationId: Id;
  conversation: Conversation | null;
  changedAt: ISODateString;
}

/** Server -> client `chat:conversation_removed`. */
export interface ChatConversationRemovedPayload {
  conversationId: Id;
  changedAt: ISODateString;
}

/** Server -> client `friend:request_*`. */
export interface FriendRequestEventPayload {
  requestId: Id;
  requesterId: Id;
  receiverId: Id;
  changedAt: ISODateString;
}

/** Server -> client `friend:removed`. */
export interface FriendRemovedEventPayload {
  relationshipId: Id;
  requesterId: Id;
  receiverId: Id;
  changedAt: ISODateString;
}

/**
 * Server -> client `call:*` (buildCallPeerPayload / relayCallEvent in backend/src/socket.js).
 * `offer` / `answer` / `candidate` are only set on the matching signaling event;
 * `call:ended` sent on disconnect carries only callId, conversationId and fromUserId.
 */
export interface CallPeerPayload {
  callId: string;
  conversationId: Id;
  fromUserId: Id;
  targetUserId?: Id;
  mode?: 'voice' | 'video';
  callerName?: string;
  callerAvatarUrl?: string;
  changedAt?: ISODateString;
  offer?: RTCSessionDescriptionInit | null;
  answer?: RTCSessionDescriptionInit | null;
  candidate?: RTCIceCandidateInit | null;
}

/** Client -> server body for `call:invite`, `call:accept`, `call:offer`, ... */
export interface CallSignalPayload {
  callId: string;
  conversationId: Id;
  targetUserId: Id;
  mode: 'voice' | 'video';
  callerName?: string;
  callerAvatarUrl?: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}
