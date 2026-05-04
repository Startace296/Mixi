import { io } from 'socket.io-client';

import { API_BASE_URL } from './axios.js';

let sharedSocket = null;

export function createAuthenticatedSocket() {
  const token = localStorage.getItem('token');

  if (!token) return null;

  return io(API_BASE_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
}

export function getAuthenticatedSocket() {
  const token = localStorage.getItem('token');

  if (!token) return null;

  if (!sharedSocket || sharedSocket.auth?.token !== token) {
    if (sharedSocket) sharedSocket.disconnect();
    sharedSocket = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
  }

  return sharedSocket;
}

export function disconnectAuthenticatedSocket() {
  if (!sharedSocket) return;
  sharedSocket.disconnect();
  sharedSocket = null;
}

export const FRIEND_SOCKET_EVENTS = [
  'friend:request_created',
  'friend:request_cancelled',
  'friend:request_accepted',
  'friend:request_declined',
  'friend:removed',
];

export const CHAT_SOCKET_EVENTS = [
  'chat:message_created',
  'chat:message_deleted',
  'chat:conversation_read',
];

export const PRESENCE_SOCKET_EVENTS = [
  'presence:changed',
];

export function emitPresenceStatus(status) {
  const socket = getAuthenticatedSocket();
  if (!socket) return;
  socket.emit('presence:set', { status });
}

export function emitChatTyping({ conversationId, isTyping }) {
  const socket = getAuthenticatedSocket();
  if (!socket || !conversationId) return;
  socket.emit('chat:typing', {
    conversationId,
    isTyping: Boolean(isTyping),
  });
}
