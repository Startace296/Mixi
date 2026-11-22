import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useChatTyping } from '../../src/hooks/chat';
import { emitChatTyping, getAuthenticatedSocket } from '../../src/lib/socket';
import { REMOTE_TYPING_TTL_MS, TYPING_IDLE_MS } from '../../src/lib/chat';

vi.mock('../../src/lib/socket', () => ({
  emitChatTyping: vi.fn(),
  getAuthenticatedSocket: vi.fn(),
}));

/** Minimal stand-in for a socket.io client: records listeners so tests can push events. */
function createFakeSocket() {
  const listeners = new Map();
  return {
    on: vi.fn((event, handler) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(handler);
    }),
    off: vi.fn((event, handler) => listeners.get(event)?.delete(handler)),
    receive(event, payload) {
      act(() => listeners.get(event)?.forEach((handler) => handler(payload)));
    },
    listenerCount: (event) => listeners.get(event)?.size || 0,
  };
}

const ME = 'me';
const BOB = 'bob';
const CAROL = 'carol';
const DIRECT_CHAT = { id: 'c1', friendId: BOB, name: 'Bob' };
const GROUP_CHAT = {
  id: 'g1',
  participants: [
    { id: ME, displayName: 'Me' },
    { id: BOB, displayName: 'Bob' },
    { id: CAROL, displayName: 'Carol' },
  ],
};

let socket;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  socket = createFakeSocket();
  getAuthenticatedSocket.mockReturnValue(socket);
});

afterEach(() => {
  vi.useRealTimers();
});

function renderTyping(props = { activeThreadId: 'c1', currentUserId: ME, selectedChat: DIRECT_CHAT }) {
  return renderHook((hookProps) => useChatTyping(hookProps), { initialProps: props });
}

describe('useChatTyping – local typing', () => {
  it('emits "typing" once while the user keeps typing, then "stopped" after the idle delay', () => {
    const { result } = renderTyping();

    act(() => result.current.handleTypingChange(true));
    act(() => result.current.handleTypingChange(true));
    act(() => vi.advanceTimersByTime(TYPING_IDLE_MS - 100));
    act(() => result.current.handleTypingChange(true));

    expect(emitChatTyping).toHaveBeenCalledTimes(1);
    expect(emitChatTyping).toHaveBeenLastCalledWith({ conversationId: 'c1', isTyping: true });

    // Each keystroke resets the idle timer.
    act(() => vi.advanceTimersByTime(TYPING_IDLE_MS - 100));
    expect(emitChatTyping).toHaveBeenCalledTimes(1);

    act(() => vi.advanceTimersByTime(200));
    expect(emitChatTyping).toHaveBeenCalledTimes(2);
    expect(emitChatTyping).toHaveBeenLastCalledWith({ conversationId: 'c1', isTyping: false });
  });

  it('emits "stopped" immediately when typing ends (e.g. the input is cleared)', () => {
    const { result } = renderTyping();

    act(() => result.current.handleTypingChange(true));
    act(() => result.current.handleTypingChange(false));

    expect(emitChatTyping).toHaveBeenLastCalledWith({ conversationId: 'c1', isTyping: false });
    act(() => vi.advanceTimersByTime(TYPING_IDLE_MS * 2));
    expect(emitChatTyping).toHaveBeenCalledTimes(2);
  });

  it('stopLocalTyping (on send) emits "stopped" only if the user was typing', () => {
    const { result } = renderTyping();

    act(() => result.current.stopLocalTyping());
    expect(emitChatTyping).not.toHaveBeenCalled();

    act(() => result.current.handleTypingChange(true));
    act(() => result.current.stopLocalTyping());
    expect(emitChatTyping).toHaveBeenLastCalledWith({ conversationId: 'c1', isTyping: false });
  });

  it('does nothing without an open conversation', () => {
    const { result } = renderTyping({ activeThreadId: null, currentUserId: ME, selectedChat: null });
    act(() => result.current.handleTypingChange(true));
    expect(emitChatTyping).not.toHaveBeenCalled();
  });

  it('sends "stopped" to the previous conversation when switching threads', () => {
    const { result, rerender } = renderTyping();
    act(() => result.current.handleTypingChange(true));

    rerender({ activeThreadId: 'c2', currentUserId: ME, selectedChat: { id: 'c2' } });

    expect(emitChatTyping).toHaveBeenLastCalledWith({ conversationId: 'c1', isTyping: false });
  });

  it('sends "stopped" when unmounted while typing', () => {
    const { result, unmount } = renderTyping();
    act(() => result.current.handleTypingChange(true));

    unmount();

    expect(emitChatTyping).toHaveBeenLastCalledWith({ conversationId: 'c1', isTyping: false });
  });
});

describe('useChatTyping – remote typing', () => {
  it('shows "<name> is typing..." for the friend in a direct chat', () => {
    const { result } = renderTyping();
    expect(result.current.typingLabel).toBe('');

    socket.receive('chat:typing', { conversationId: 'c1', userId: BOB, isTyping: true });
    expect(result.current.typingLabel).toBe('Bob is typing...');

    socket.receive('chat:typing', { conversationId: 'c1', userId: BOB, isTyping: false });
    expect(result.current.typingLabel).toBe('');
  });

  it('clears the indicator automatically if "stopped" never arrives', () => {
    const { result } = renderTyping();
    socket.receive('chat:typing', { conversationId: 'c1', userId: BOB, isTyping: true });

    act(() => vi.advanceTimersByTime(REMOTE_TYPING_TTL_MS - 1));
    expect(result.current.typingLabel).toBe('Bob is typing...');

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.typingLabel).toBe('');
  });

  it('extends the timeout while the friend keeps typing', () => {
    const { result } = renderTyping();
    socket.receive('chat:typing', { conversationId: 'c1', userId: BOB, isTyping: true });
    act(() => vi.advanceTimersByTime(REMOTE_TYPING_TTL_MS - 500));
    socket.receive('chat:typing', { conversationId: 'c1', userId: BOB, isTyping: true });
    act(() => vi.advanceTimersByTime(REMOTE_TYPING_TTL_MS - 500));

    expect(result.current.typingLabel).toBe('Bob is typing...');
  });

  it('ignores events for other conversations and from the current user', () => {
    const { result } = renderTyping();

    socket.receive('chat:typing', { conversationId: 'other', userId: BOB, isTyping: true });
    socket.receive('chat:typing', { conversationId: 'c1', userId: ME, isTyping: true });
    socket.receive('chat:typing', { conversationId: 'c1', isTyping: true });

    expect(result.current.typingLabel).toBe('');
  });

  it('uses member names in a group, and a generic label for several typers', () => {
    const { result } = renderTyping({ activeThreadId: 'g1', currentUserId: ME, selectedChat: GROUP_CHAT });

    socket.receive('chat:typing', { conversationId: 'g1', userId: CAROL, isTyping: true });
    expect(result.current.typingLabel).toBe('Carol is typing...');

    socket.receive('chat:typing', { conversationId: 'g1', userId: BOB, isTyping: true });
    expect(result.current.typingLabel).toBe('Several people are typing...');

    socket.receive('chat:typing', { conversationId: 'g1', userId: CAROL, isTyping: false });
    expect(result.current.typingLabel).toBe('Bob is typing...');
  });

  it('resets the indicator and the listener when switching conversations', () => {
    const { result, rerender } = renderTyping();
    socket.receive('chat:typing', { conversationId: 'c1', userId: BOB, isTyping: true });

    rerender({ activeThreadId: 'c2', currentUserId: ME, selectedChat: { id: 'c2', friendId: CAROL, name: 'Carol' } });

    expect(result.current.typingLabel).toBe('');
    expect(socket.listenerCount('chat:typing')).toBe(1);
  });

  it('removes its socket listener on unmount', () => {
    const { unmount } = renderTyping();
    expect(socket.listenerCount('chat:typing')).toBe(1);
    unmount();
    expect(socket.listenerCount('chat:typing')).toBe(0);
  });

  it('works without a socket (logged out)', () => {
    getAuthenticatedSocket.mockReturnValue(null);
    const { result } = renderTyping();
    expect(result.current.typingLabel).toBe('');
  });
});
