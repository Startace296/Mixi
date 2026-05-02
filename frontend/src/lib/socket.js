import { io } from 'socket.io-client';

import { API_BASE_URL } from './axios.js';

export function createAuthenticatedSocket() {
  const token = localStorage.getItem('token');

  if (!token) return null;

  return io(API_BASE_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
}

export const FRIEND_SOCKET_EVENTS = [
  'friend:request_created',
  'friend:request_cancelled',
  'friend:request_accepted',
  'friend:request_declined',
  'friend:removed',
];
