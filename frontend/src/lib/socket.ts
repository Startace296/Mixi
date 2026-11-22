import { io, type Socket } from 'socket.io-client';

import { API_BASE_URL } from './api/client';
import { createDeliveryAcker } from './chat/coalesce';
import type { ChatMessageEventPayload, Id, PresenceStatus } from '../types';

let sharedSocket: Socket | null = null;
let disposeDeliveryAcks: (() => void) | null = null;

/** The `sub` claim of the access token (the user id), without verifying it. */
function readTokenUserId(token: string): string | null {
  try {
    const payload = token.split('.')[1] || '';
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const sub = (JSON.parse(json) as { sub?: unknown }).sub;
    return sub ? String(sub) : null;
  } catch {
    return null;
  }
}

/**
 * Acknowledges delivery of every message this device receives from someone else, for
 * as long as the shared socket lives: on any page, not only while a chat is open.
 * Bursts are coalesced into one ack per conversation. While disconnected socket.io
 * buffers the emits and sends them on reconnect.
 */
function installDeliveryAcks(socket: Socket, currentUserId: string | null): () => void {
  const acker = createDeliveryAcker((conversationId, messageId) => {
    socket.emit('chat:ack_delivered', { conversationId, messageId });
  });

  const handleMessageCreated = (payload: Partial<ChatMessageEventPayload> | undefined) => {
    const message = payload?.message;
    if (!payload?.conversationId || !message?._id || !message.createdAt) return;
    if (currentUserId && String(message.senderId) === currentUserId) return;
    acker.queue(payload.conversationId, message);
  };

  socket.on('chat:message_created', handleMessageCreated);
  return () => {
    socket.off('chat:message_created', handleMessageCreated);
    acker.dispose();
  };
}

function readSocketToken(socket: Socket): string | undefined {
  const auth = socket.auth as { token?: string } | undefined;
  return auth?.token;
}

export function createAuthenticatedSocket(): Socket | null {
  const token = localStorage.getItem('token');

  if (!token) return null;

  return io(API_BASE_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
}

export function getAuthenticatedSocket(): Socket | null {
  const token = localStorage.getItem('token');

  if (!token) return null;

  if (!sharedSocket || readSocketToken(sharedSocket) !== token) {
    if (sharedSocket) sharedSocket.disconnect();
    disposeDeliveryAcks?.();
    sharedSocket = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    disposeDeliveryAcks = installDeliveryAcks(sharedSocket, readTokenUserId(token));
  }

  return sharedSocket;
}

export function disconnectAuthenticatedSocket(): void {
  if (!sharedSocket) return;
  disposeDeliveryAcks?.();
  disposeDeliveryAcks = null;
  sharedSocket.disconnect();
  sharedSocket = null;
}

export const FRIEND_SOCKET_EVENTS = [
  'friend:request_created',
  'friend:request_cancelled',
  'friend:request_accepted',
  'friend:request_declined',
  'friend:removed',
] as const;

export const CHAT_SOCKET_EVENTS = [
  'chat:message_created',
  'chat:message_deleted',
  'chat:conversation_read',
  'chat:conversation_updated',
] as const;

export const PRESENCE_SOCKET_EVENTS = ['presence:changed'] as const;

export type FriendSocketEvent = (typeof FRIEND_SOCKET_EVENTS)[number];
export type ChatSocketEvent = (typeof CHAT_SOCKET_EVENTS)[number];
export type PresenceSocketEvent = (typeof PRESENCE_SOCKET_EVENTS)[number];

export const RECEIPT_SOCKET_EVENT = 'chat:receipt_updated' as const;

export function emitPresenceStatus(status: PresenceStatus): void {
  const socket = getAuthenticatedSocket();
  if (!socket) return;
  socket.emit('presence:set', { status });
}

export function emitChatTyping({ conversationId, isTyping }: { conversationId: Id | null | undefined; isTyping: boolean }): void {
  const socket = getAuthenticatedSocket();
  if (!socket || !conversationId) return;
  socket.emit('chat:typing', {
    conversationId,
    isTyping: Boolean(isTyping),
  });
}
