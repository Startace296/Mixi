import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fakeSockets = [];
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => {
    const handlers = {};
    const socket = {
      on: (event, fn) => { handlers[event] = fn; },
      off: (event) => { delete handlers[event]; },
      emit: vi.fn(),
      disconnect: vi.fn(),
      deliver: (payload) => handlers['chat:message_created']?.(payload),
    };
    fakeSockets.push(socket);
    return socket;
  }),
}));

const { disconnectAuthenticatedSocket, getAuthenticatedSocket } = await import('../../src/lib/socket');

/** An unsigned JWT is enough: the client only reads `sub` to skip its own messages. */
const tokenFor = (sub) => `x.${btoa(JSON.stringify({ sub })).replace(/=+$/, '')}.y`;
const at = (second) => new Date(Date.UTC(2025, 0, 1, 10, 0, second)).toISOString();
const incoming = (id, second, senderId = 'bob', conversationId = 'c1') => ({
  conversationId,
  message: { _id: id, senderId, createdAt: at(second) },
});

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.setItem('token', tokenFor('me'));
});

afterEach(() => {
  disconnectAuthenticatedSocket();
  fakeSockets.length = 0;
});

describe('delivery acks on the shared socket', () => {
  it('acks messages from others, coalesced per conversation, and never my own', () => {
    const socket = getAuthenticatedSocket();
    const fake = fakeSockets[0];
    expect(socket).toBe(fake);

    fake.deliver(incoming('m1', 1));
    fake.deliver(incoming('m2', 2));
    fake.deliver(incoming('mine', 3, 'me'));
    vi.runAllTimers();

    expect(fake.emit.mock.calls).toEqual([['chat:ack_delivered', { conversationId: 'c1', messageId: 'm2' }]]);
  });

  it('stops acking once the socket is disconnected', () => {
    getAuthenticatedSocket();
    const fake = fakeSockets[0];
    fake.deliver(incoming('m1', 1));
    disconnectAuthenticatedSocket();
    vi.runAllTimers();

    expect(fake.emit).not.toHaveBeenCalled();
  });
});
