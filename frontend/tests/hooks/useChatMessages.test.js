import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useChatMessages } from '../../src/hooks/chat/useChatMessages';
import { getChatMessages, markChatConversationRead, sendChatMessage } from '../../src/lib/api';
import { getAuthenticatedSocket } from '../../src/lib/socket';

vi.mock('../../src/lib/api');
vi.mock('../../src/lib/socket');

/** Minimal socket.io stand-in: records handlers so tests can emit server events. */
function fakeSocket() {
  const handlers = {};
  const managerHandlers = {};
  return {
    on: (event, fn) => { handlers[event] = fn; },
    off: (event) => { delete handlers[event]; },
    io: {
      on: (event, fn) => { managerHandlers[event] = fn; },
      off: (event) => { delete managerHandlers[event]; },
    },
    emit: (event, payload) => act(() => handlers[event]?.(payload)),
    reconnect: () => act(async () => { managerHandlers.reconnect?.(); }),
  };
}

const message = (id, conversationId = 'c1', extra = {}) => ({
  _id: id,
  id,
  conversationId,
  senderId: 'bob',
  text: id,
  createdAt: new Date(2025, 0, 1, 10, Number(id.replace(/\D/g, '')) || 0).toISOString(),
  cursor: `cur-${id}`,
  ...extra,
});

const page = (messages, pageInfo = {}, extra = {}) => ({
  messages,
  serverTime: '2025-01-01T12:00:00.000Z',
  ...extra,
  pageInfo: {
    hasOlder: false,
    hasNewer: false,
    startCursor: messages[0]?.cursor ?? null,
    endCursor: messages[messages.length - 1]?.cursor ?? null,
    ...pageInfo,
  },
});

/** A promise the test resolves by hand, to control request ordering. */
function deferred() {
  let resolve;
  const promise = new Promise((res) => { resolve = res; });
  return { promise, resolve };
}

let socket;
beforeEach(() => {
  vi.clearAllMocks();
  socket = fakeSocket();
  getAuthenticatedSocket.mockReturnValue(socket);
  markChatConversationRead.mockResolvedValue({});
});

function renderChat(initialThreadId = 'c1', unread = 0) {
  return renderHook(
    ({ threadId, unreadCount }) => useChatMessages({
      activeThreadId: threadId,
      selectedChat: { unread: unreadCount },
      currentUserId: 'me',
    }),
    { initialProps: { threadId: initialThreadId, unreadCount: unread } },
  );
}

const texts = (result) => result.current.messages.map((m) => m.text);

describe('useChatMessages – cursor pagination', () => {
  it('loads the newest page, sized to the unread count, then older pages by cursor', async () => {
    getChatMessages.mockResolvedValueOnce(page([message('m3'), message('m4')], { hasOlder: true }));
    const { result } = renderChat('c1', 45);

    await waitFor(() => expect(texts(result)).toEqual(['m3', 'm4']));
    expect(getChatMessages).toHaveBeenLastCalledWith(expect.objectContaining({ conversationId: 'c1', limit: 55 }));
    expect(result.current.hasOlderMessages).toBe(true);
    expect(result.current.initialUnreadCount).toBe(45);

    getChatMessages.mockResolvedValueOnce(page([message('m1'), message('m2')]));
    await act(() => result.current.handleLoadOlderMessages());

    expect(getChatMessages).toHaveBeenLastCalledWith(expect.objectContaining({ before: 'cur-m3' }));
    expect(texts(result)).toEqual(['m1', 'm2', 'm3', 'm4']);
    expect(result.current.hasOlderMessages).toBe(false);
  });

  it('sends one older request at a time however many times scrolling asks', async () => {
    getChatMessages.mockResolvedValueOnce(page([message('m3')], { hasOlder: true }));
    const { result } = renderChat();
    await waitFor(() => expect(texts(result)).toEqual(['m3']));

    const older = deferred();
    getChatMessages.mockReturnValueOnce(older.promise);
    act(() => {
      result.current.handleLoadOlderMessages();
      result.current.handleLoadOlderMessages();
      result.current.handleLoadOlderMessages();
    });
    expect(getChatMessages).toHaveBeenCalledTimes(2);

    await act(async () => older.resolve(page([message('m2')])));
    expect(texts(result)).toEqual(['m2', 'm3']);
  });

  it('keeps the loaded timeline when an older page fails, and reports it separately', async () => {
    getChatMessages.mockResolvedValueOnce(page([message('m3')], { hasOlder: true }));
    const { result } = renderChat();
    await waitFor(() => expect(texts(result)).toEqual(['m3']));

    getChatMessages.mockRejectedValueOnce(new Error('Network down'));
    await act(() => result.current.handleLoadOlderMessages());

    expect(texts(result)).toEqual(['m3']);
    expect(result.current.error).toBe('');
    expect(result.current.olderError).toBe('Network down');
  });

  it('reopening a chat shows the cache instantly and only fetches what is newer', async () => {
    getChatMessages.mockResolvedValueOnce(page([message('m1'), message('m2')], { hasOlder: true }));
    const { result, rerender } = renderChat('c1');
    await waitFor(() => expect(texts(result)).toEqual(['m1', 'm2']));

    getChatMessages.mockResolvedValueOnce(page([message('x1', 'c2')]));
    rerender({ threadId: 'c2', unreadCount: 0 });
    await waitFor(() => expect(texts(result)).toEqual(['x1']));

    const catchUp = deferred();
    getChatMessages.mockReturnValueOnce(catchUp.promise);
    rerender({ threadId: 'c1', unreadCount: 1 });

    // The cached timeline is on screen in the same render, before any response.
    expect(texts(result)).toEqual(['m1', 'm2']);
    expect(result.current.isLoading).toBe(false);
    expect(getChatMessages).toHaveBeenLastCalledWith(expect.objectContaining({ conversationId: 'c1', after: 'cur-m2' }));

    await act(async () => catchUp.resolve(page([message('m3')], { hasOlder: true })));
    expect(texts(result)).toEqual(['m1', 'm2', 'm3']);
    expect(result.current.hasOlderMessages).toBe(true);
  });

  it('restarts from the newest page when the cache is more than a page behind', async () => {
    getChatMessages.mockResolvedValueOnce(page([message('m1')]));
    const { result, rerender } = renderChat('c1');
    await waitFor(() => expect(texts(result)).toEqual(['m1']));

    getChatMessages.mockResolvedValueOnce(page([]));
    rerender({ threadId: 'c2', unreadCount: 0 });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    getChatMessages
      .mockResolvedValueOnce(page([message('m2')], { hasOlder: true, hasNewer: true }))
      .mockResolvedValueOnce(page([message('m90'), message('m91')], { hasOlder: true }));
    rerender({ threadId: 'c1', unreadCount: 0 });

    await waitFor(() => expect(texts(result)).toEqual(['m90', 'm91']));
    expect(getChatMessages.mock.lastCall[0].after).toBeUndefined();
  });

  it('never lets a slow response for one chat land in another', async () => {
    const slow = deferred();
    getChatMessages.mockReturnValueOnce(slow.promise);
    const { result, rerender } = renderChat('c1');

    getChatMessages.mockResolvedValueOnce(page([message('x1', 'c2')]));
    rerender({ threadId: 'c2', unreadCount: 0 });
    await waitFor(() => expect(texts(result)).toEqual(['x1']));

    await act(async () => slow.resolve(page([message('m1')])));
    expect(texts(result)).toEqual(['x1']);
  });

  it('keeps background chats current from socket events, and catches up after a reconnect', async () => {
    getChatMessages.mockResolvedValueOnce(page([message('m1')]));
    const { result, rerender } = renderChat('c1');
    await waitFor(() => expect(texts(result)).toEqual(['m1']));

    getChatMessages.mockResolvedValueOnce(page([message('x1', 'c2')]));
    rerender({ threadId: 'c2', unreadCount: 0 });
    await waitFor(() => expect(texts(result)).toEqual(['x1']));

    // c1 is in the background: the event still updates its cached timeline.
    socket.emit('chat:message_created', { conversationId: 'c1', message: message('m2') });
    expect(markChatConversationRead).not.toHaveBeenCalled();

    getChatMessages.mockResolvedValueOnce(page([]));
    rerender({ threadId: 'c1', unreadCount: 0 });
    expect(texts(result)).toEqual(['m1', 'm2']);
    expect(getChatMessages).toHaveBeenLastCalledWith(expect.objectContaining({ after: 'cur-m2' }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    getChatMessages.mockResolvedValueOnce(page([message('m3')]));
    await socket.reconnect();
    await waitFor(() => expect(texts(result)).toEqual(['m1', 'm2', 'm3']));
  });

  it('blanks messages deleted while the socket was down, using the last serverTime', async () => {
    getChatMessages.mockResolvedValueOnce(page([message('m1'), message('m2')], {}, { serverTime: 'T1' }));
    const { result } = renderChat('c1');
    await waitFor(() => expect(texts(result)).toEqual(['m1', 'm2']));

    getChatMessages.mockResolvedValueOnce(page([message('m3')], {}, { serverTime: 'T2', deletedMessageIds: ['m1'] }));
    await socket.reconnect();

    await waitFor(() => expect(result.current.messages.map((m) => Boolean(m.isDeleted))).toEqual([true, false, false]));
    expect(getChatMessages).toHaveBeenLastCalledWith(expect.objectContaining({ after: 'cur-m2', deletedSince: 'T1' }));
    expect(result.current.messages[0].text).toBe('');

    // The next sync asks from the newer serverTime.
    getChatMessages.mockResolvedValueOnce(page([], {}, { serverTime: 'T3', deletedMessageIds: [] }));
    await socket.reconnect();
    await waitFor(() => expect(getChatMessages).toHaveBeenLastCalledWith(expect.objectContaining({ deletedSince: 'T2' })));
  });

  it('reloads the newest page when there are more deletions than one sync reports', async () => {
    getChatMessages.mockResolvedValueOnce(page([message('m1')]));
    const { result } = renderChat('c1');
    await waitFor(() => expect(texts(result)).toEqual(['m1']));

    getChatMessages
      .mockResolvedValueOnce(page([], {}, { deletedMessageIds: ['m1'], deletedTruncated: true }))
      .mockResolvedValueOnce(page([message('m5')]));
    await socket.reconnect();

    await waitFor(() => expect(texts(result)).toEqual(['m5']));
    expect(getChatMessages.mock.lastCall[0].after).toBeUndefined();
  });

  it('marks read up to the message that arrived, one request at a time, newest last', async () => {
    getChatMessages.mockResolvedValueOnce(page([message('m1')]));
    renderChat('c1');
    await waitFor(() => expect(getChatMessages).toHaveBeenCalledTimes(1));

    const first = deferred();
    markChatConversationRead.mockReturnValueOnce(first.promise);
    socket.emit('chat:message_created', { conversationId: 'c1', message: message('m2') });
    socket.emit('chat:message_created', { conversationId: 'c1', message: message('m3') });
    socket.emit('chat:message_created', { conversationId: 'c1', message: message('m4') });

    // m3 and m4 wait for m2's request; only the newest of them is sent after it.
    expect(markChatConversationRead.mock.calls).toEqual([[{ conversationId: 'c1', upToMessageId: 'm2' }]]);
    await act(async () => first.resolve({}));
    await waitFor(() => expect(markChatConversationRead).toHaveBeenCalledTimes(2));
    expect(markChatConversationRead).toHaveBeenLastCalledWith({ conversationId: 'c1', upToMessageId: 'm4' });
  });

  it('does not count messages as read while the tab is hidden, and reads them on return', async () => {
    getChatMessages.mockResolvedValueOnce(page([message('m1')]));
    renderChat('c1');
    await waitFor(() => expect(getChatMessages).toHaveBeenCalledTimes(1));

    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    socket.emit('chat:message_created', { conversationId: 'c1', message: message('m2') });
    expect(markChatConversationRead).not.toHaveBeenCalled();

    visibility.mockReturnValue('visible');
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(markChatConversationRead).toHaveBeenCalledWith({ conversationId: 'c1', upToMessageId: 'm2' });
    visibility.mockRestore();
  });

  it("never marks my own messages, or another chat's, as read", async () => {
    getChatMessages.mockResolvedValueOnce(page([message('m1')]));
    renderChat('c1');
    await waitFor(() => expect(getChatMessages).toHaveBeenCalledTimes(1));

    socket.emit('chat:message_created', { conversationId: 'c1', message: message('m2', 'c1', { senderId: 'me' }) });
    socket.emit('chat:message_created', { conversationId: 'c9', message: message('z1', 'c9') });
    expect(markChatConversationRead).not.toHaveBeenCalled();
  });

  it('keeps a message that arrives over the socket while the first page is loading', async () => {
    const first = deferred();
    getChatMessages.mockReturnValueOnce(first.promise);
    const { result } = renderChat('c1');

    socket.emit('chat:message_created', { conversationId: 'c1', message: message('m9') });
    await act(async () => first.resolve(page([message('m7'), message('m8')])));

    expect(texts(result)).toEqual(['m7', 'm8', 'm9']);
  });
});

describe('useChatMessages – failed sends and retry', () => {
  async function openChat() {
    getChatMessages.mockResolvedValueOnce(page([message('m1')]));
    const view = renderChat('c1');
    await waitFor(() => expect(texts(view.result)).toEqual(['m1']));
    return view;
  }
  const pendingOf = (result) => result.current.messages.find((m) => m._optimistic);

  it('keeps a failed message on screen, marked failed, instead of dropping it', async () => {
    const { result } = await openChat();
    sendChatMessage.mockRejectedValueOnce(new Error('offline'));

    await act(() => result.current.handleSendMessage('hello?'));

    expect(texts(result)).toEqual(['m1', 'hello?']);
    expect(pendingOf(result)).toMatchObject({ _optimistic: true, _failed: true });
  });

  it('retries with the same idempotency key, once however often Retry is pressed', async () => {
    const { result } = await openChat();
    sendChatMessage.mockRejectedValueOnce(new Error('timeout'));
    await act(() => result.current.handleSendMessage('again'));
    const { _id: tempId, clientMessageId } = pendingOf(result);

    const retry = deferred();
    sendChatMessage.mockReturnValueOnce(retry.promise);
    act(() => {
      result.current.handleRetryMessage(tempId);
      result.current.handleRetryMessage(tempId);
    });
    expect(sendChatMessage).toHaveBeenCalledTimes(2);
    expect(sendChatMessage.mock.calls[1][0]).toMatchObject({ clientMessageId, text: 'again' });
    expect(pendingOf(result)._failed).toBe(false);

    await act(async () => retry.resolve({ message: message('m2', 'c1', { senderId: 'me', text: 'again', clientMessageId }) }));
    expect(texts(result)).toEqual(['m1', 'again']);
    expect(pendingOf(result)).toBeUndefined();
  });

  it('the socket copy takes the pending bubble\'s place, so the HTTP reply adds nothing', async () => {
    const { result } = await openChat();
    const reply = deferred();
    sendChatMessage.mockReturnValueOnce(reply.promise);
    let sending;
    act(() => { sending = result.current.handleSendMessage('race'); });
    const { clientMessageId } = pendingOf(result);
    const real = message('m2', 'c1', { senderId: 'me', text: 'race', clientMessageId });

    socket.emit('chat:message_created', { conversationId: 'c1', message: real });
    expect(texts(result)).toEqual(['m1', 'race']);
    expect(pendingOf(result)).toBeUndefined();

    await act(async () => { reply.resolve({ message: real }); await sending; });
    expect(texts(result)).toEqual(['m1', 'race']);
  });

  it('discarding a failed message removes it', async () => {
    const { result } = await openChat();
    sendChatMessage.mockRejectedValueOnce(new Error('offline'));
    await act(() => result.current.handleSendMessage('never mind'));

    act(() => result.current.handleDiscardMessage(pendingOf(result)._id));
    expect(texts(result)).toEqual(['m1']);
  });
});
