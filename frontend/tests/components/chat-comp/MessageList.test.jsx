import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';

import MessageList from '../../../src/components/chat-comp/MessageList';
import { suggestChatReplies, summarizeChat } from '../../../src/lib/api';

vi.mock('../../../src/lib/api');
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
});

const ME = 'me';
const BOB = 'bob';

let nextId = 0;
function msg(overrides = {}) {
  nextId += 1;
  return {
    _id: `m${nextId}`,
    senderId: BOB,
    senderName: 'Bob',
    senderAvatar: 'https://cdn.test/bob.jpg',
    text: `message ${nextId}`,
    type: 'text',
    createdAt: new Date(2025, 0, 10, 9, nextId).toISOString(),
    ...overrides,
  };
}

/** n plain messages alternating between Bob and me, ids m1..mn. */
function conversation(count) {
  nextId = 0;
  return Array.from({ length: count }, (_, index) => msg({ senderId: index % 2 ? ME : BOB }));
}

function renderList(props = {}) {
  const user = userEvent.setup();
  const utils = render(
    <MessageList messages={[]} currentUserId={ME} threadId="c1" {...props} />,
  );
  return { user, ...utils };
}

/** The bubble <div> that contains a message's text (the row is its ancestor). */
const rowOf = (text) => screen.getByText(text).closest('.group');

describe('MessageList – states', () => {
  it('shows a loading state', () => {
    renderList({ isLoading: true, messages: conversation(2) });
    expect(screen.getByText('Loading messages...')).toBeInTheDocument();
    expect(screen.queryByText('message 1')).not.toBeInTheDocument();
  });

  it('shows the error message', () => {
    renderList({ error: 'Could not load messages' });
    expect(screen.getByText('Could not load messages')).toBeInTheDocument();
  });

  it('shows an empty state when there are no messages', () => {
    renderList({ messages: [] });
    expect(screen.getByText(/No messages yet/)).toBeInTheDocument();
  });
});

describe('MessageList – rendering messages', () => {
  it('renders every message, mine on the right and theirs on the left', () => {
    renderList({
      messages: [msg({ _id: 'a', text: 'hi from bob' }), msg({ _id: 'b', senderId: ME, text: 'hi from me' })],
    });

    expect(rowOf('hi from bob')).toHaveClass('justify-start');
    expect(rowOf('hi from me')).toHaveClass('justify-end');
  });

  it('renders deleted, image and call messages', () => {
    renderList({
      messages: [
        msg({ text: '', isDeleted: true }),
        msg({ text: 'look', imageUrl: 'https://cdn.test/photo.jpg' }),
        msg({ text: '', type: 'call', call: { mode: 'voice', status: 'ended', durationSeconds: 75 } }),
        msg({ senderId: ME, text: '', type: 'call', call: { mode: 'video', status: 'missed' } }),
      ],
    });

    expect(screen.getByText('This message was deleted')).toBeInTheDocument();
    expect(rowOf('look').querySelector('img[src="https://cdn.test/photo.jpg"]')).not.toBeNull();
    expect(screen.getByText('Voice call · 1m 15s')).toBeInTheDocument();
    expect(screen.getByText('No answer')).toBeInTheDocument();
  });

  it('shows a date divider only when the day changes', () => {
    renderList({
      messages: [
        msg({ createdAt: new Date(2025, 0, 10, 9, 0).toISOString() }),
        msg({ createdAt: new Date(2025, 0, 10, 18, 0).toISOString() }),
        msg({ createdAt: new Date(2025, 0, 12, 8, 0).toISOString() }),
      ],
    });

    expect(screen.getAllByText('10/01/2025')).toHaveLength(1);
    expect(screen.getAllByText('12/01/2025')).toHaveLength(1);
  });

  it('shows sender avatars for other members in group chats only', () => {
    const messages = [msg({ text: 'from bob' }), msg({ senderId: ME, senderName: 'Me', text: 'from me' })];

    const { unmount } = renderList({ messages, isGroupChat: true });
    expect(screen.getByAltText('Bob')).toBeInTheDocument();
    expect(screen.queryByAltText('Me')).not.toBeInTheDocument();
    unmount();

    renderList({ messages, isGroupChat: false });
    expect(screen.queryByAltText('Bob')).not.toBeInTheDocument();
  });
});

describe('MessageList – message actions', () => {
  it('lets me delete my own message from its menu', async () => {
    const onDeleteMessage = vi.fn();
    const { user } = renderList({
      messages: [msg({ _id: 'mine', senderId: ME, text: 'delete me' })],
      onDeleteMessage,
    });

    await user.click(within(rowOf('delete me')).getByRole('button', { name: 'Open message actions' }));
    await user.click(screen.getByRole('button', { name: 'Delete message' }));

    expect(onDeleteMessage).toHaveBeenCalledWith('mine');
    expect(screen.queryByRole('button', { name: 'Delete message' })).not.toBeInTheDocument();
  });

  it("does not offer delete on someone else's message", async () => {
    const { user } = renderList({ messages: [msg({ text: 'from bob' })] });

    await user.click(screen.getByRole('button', { name: 'Open message actions' }));

    expect(screen.getByRole('button', { name: 'Summarize from here' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete message' })).not.toBeInTheDocument();
  });

  it('has no menu for deleted, call or still-sending messages', () => {
    renderList({
      messages: [
        msg({ senderId: ME, text: '', isDeleted: true }),
        msg({ senderId: ME, text: '', type: 'call', call: { status: 'ended' } }),
        msg({ senderId: ME, text: 'sending…', _optimistic: true }),
      ],
    });
    expect(screen.queryByRole('button', { name: 'Open message actions' })).not.toBeInTheDocument();
    expect(rowOf('sending…')).toHaveClass('opacity-60');
  });

  it('keeps only one menu open and closes it on an outside click', async () => {
    const { user } = renderList({
      messages: [msg({ senderId: ME, text: 'first' }), msg({ senderId: ME, text: 'second' })],
    });

    await user.click(within(rowOf('first')).getByRole('button', { name: 'Open message actions' }));
    await user.click(within(rowOf('second')).getByRole('button', { name: 'Open message actions' }));
    expect(screen.getAllByRole('button', { name: 'Delete message' })).toHaveLength(1);
    expect(within(rowOf('second')).getByRole('button', { name: 'Delete message' })).toBeInTheDocument();

    await user.click(document.body);
    expect(screen.queryByRole('button', { name: 'Delete message' })).not.toBeInTheDocument();
  });
});

describe('MessageList – older messages', () => {
  const listOf = () => screen.getByRole('log', { name: 'Messages' });

  /** jsdom has no layout: give the list a size so distances from top/bottom mean something. */
  function sizeList(list, { scrollHeight = 5000, clientHeight = 500 } = {}) {
    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: scrollHeight });
    Object.defineProperty(list, 'clientHeight', { configurable: true, value: clientHeight });
    list.scrollTo = vi.fn();
  }

  it('loads the older page as soon as the top is within reach, e.g. a short first page', () => {
    const onLoadOlderMessages = vi.fn();
    renderList({ messages: conversation(3), hasOlderMessages: true, onLoadOlderMessages });

    expect(screen.getByText('Scroll up for older messages')).toBeInTheDocument();
    expect(onLoadOlderMessages).toHaveBeenCalledTimes(1);
  });

  it('prefetches when scrolled near the top, not while far down', () => {
    const onLoadOlderMessages = vi.fn();
    const { rerender } = renderList({
      messages: conversation(3), hasOlderMessages: true, isLoadingOlder: true, onLoadOlderMessages,
    });
    const list = listOf();
    sizeList(list);

    rerender(<MessageList messages={conversation(3)} currentUserId={ME} threadId="c1" hasOlderMessages onLoadOlderMessages={onLoadOlderMessages} />);
    onLoadOlderMessages.mockClear();

    fireEvent.scroll(list, { target: { scrollTop: 2000 } });
    expect(onLoadOlderMessages).not.toHaveBeenCalled();

    fireEvent.scroll(list, { target: { scrollTop: 300 } });
    expect(onLoadOlderMessages).toHaveBeenCalledTimes(1);
  });

  it('does not load again while a page is already loading, or when there is nothing older', () => {
    const onLoadOlderMessages = vi.fn();
    const { rerender } = renderList({
      messages: conversation(3), hasOlderMessages: true, isLoadingOlder: true, onLoadOlderMessages,
    });

    expect(screen.getByText('Loading older messages...')).toBeInTheDocument();
    fireEvent.scroll(listOf(), { target: { scrollTop: 0 } });

    rerender(<MessageList messages={conversation(3)} currentUserId={ME} threadId="c1" onLoadOlderMessages={onLoadOlderMessages} />);
    expect(screen.getByText('This is the beginning of the conversation')).toBeInTheDocument();
    fireEvent.scroll(listOf(), { target: { scrollTop: 0 } });

    expect(onLoadOlderMessages).not.toHaveBeenCalled();
  });

  it('stops auto-loading after a failure and offers a retry instead', async () => {
    const onLoadOlderMessages = vi.fn();
    const { user } = renderList({
      messages: conversation(3),
      hasOlderMessages: true,
      olderError: "Couldn't load older messages",
      onLoadOlderMessages,
    });

    fireEvent.scroll(listOf(), { target: { scrollTop: 0 } });
    expect(onLoadOlderMessages).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load older messages");

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onLoadOlderMessages).toHaveBeenCalledTimes(1);
  });

  it('shows a skeleton, not the list, while the first page loads', () => {
    renderList({ isLoading: true, messages: conversation(2), hasOlderMessages: true });
    expect(listOf()).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('Scroll up for older messages')).not.toBeInTheDocument();
  });
});

describe('MessageList – new messages while scrolled up', () => {
  const listOf = () => screen.getByRole('log', { name: 'Messages' });

  function scrolledUpList(messages) {
    const utils = renderList({ messages });
    const list = listOf();
    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 5000 });
    Object.defineProperty(list, 'clientHeight', { configurable: true, value: 500 });
    list.scrollTo = vi.fn();
    fireEvent.scroll(list, { target: { scrollTop: 1000 } });
    return { ...utils, list };
  }

  it('counts incoming messages instead of yanking the view, and jumps down on click', async () => {
    const messages = conversation(3);
    const { rerender, list, user } = scrolledUpList(messages);
    expect(screen.getByRole('button', { name: 'Jump to latest' })).toBeInTheDocument();

    const withIncoming = [...messages, msg({ _id: 'in1' }), msg({ _id: 'in2' })];
    rerender(<MessageList messages={withIncoming} currentUserId={ME} threadId="c1" />);
    expect(list.scrollTop).toBe(1000);

    await user.click(screen.getByRole('button', { name: '2 new messages' }));
    expect(list.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 5000 }));
    expect(screen.queryByRole('button', { name: /new message/ })).not.toBeInTheDocument();
  });

  it('follows my own message to the bottom even when scrolled up', () => {
    const messages = conversation(3);
    const { rerender, list } = scrolledUpList(messages);

    rerender(<MessageList messages={[...messages, msg({ _id: 'mine', senderId: ME })]} currentUserId={ME} threadId="c1" />);
    expect(list.scrollTop).toBe(5000);
    expect(screen.queryByRole('button', { name: /new message/ })).not.toBeInTheDocument();
  });
});

describe('MessageList – delivery status', () => {
  const at = (minute) => new Date(2025, 0, 10, 9, minute).toISOString();
  const watermark = (userId, { delivered, read } = {}) => ({
    userId,
    deliveredAt: delivered?.createdAt ?? null,
    deliveredMessageId: delivered?._id ?? null,
    readAt: read?.createdAt ?? null,
    readMessageId: read?._id ?? null,
  });
  const members = [{ id: ME, displayName: 'Me' }, { id: BOB, displayName: 'Bob' }, { id: 'cat', displayName: 'Cat' }];

  it('shows the status only under my latest message, and "Sending…" under pending ones', () => {
    const older = msg({ _id: 'a1', senderId: ME, createdAt: at(1) });
    const latest = msg({ _id: 'a2', senderId: ME, createdAt: at(2) });
    const pending = msg({ _id: 'tmp', senderId: ME, createdAt: at(3), _optimistic: true });
    const { container } = renderList({
      messages: [older, latest, pending],
      members: members.slice(0, 2),
      receipts: [watermark(BOB, { delivered: latest })],
    });

    const statuses = [...container.querySelectorAll('[data-status]')].map((node) => node.dataset.status);
    expect(statuses).toEqual(['delivered', 'sending']);
    expect(screen.getByText('Delivered')).toBeInTheDocument();
    expect(screen.getByText('Sending…')).toBeInTheDocument();
  });

  it('updates live from sent to seen as receipts arrive', () => {
    const mine = msg({ _id: 'a1', senderId: ME, createdAt: at(1) });
    const props = { messages: [mine], currentUserId: ME, threadId: 'c1', members: members.slice(0, 2) };
    const { rerender } = render(<MessageList {...props} receipts={[]} />);
    expect(screen.getByText('Sent')).toBeInTheDocument();

    rerender(<MessageList {...props} receipts={[watermark(BOB, { read: mine })]} />);
    expect(screen.getByText('Seen')).toBeInTheDocument();
  });

  it('names who has seen it in a group until everyone has', () => {
    const mine = msg({ _id: 'a1', senderId: ME, createdAt: at(1) });
    const props = { messages: [mine], currentUserId: ME, threadId: 'g1', isGroupChat: true, members };
    const { rerender } = render(
      <MessageList {...props} receipts={[watermark(BOB, { read: mine }), watermark('cat', { delivered: mine })]} />,
    );
    expect(screen.getByText('Delivered')).toBeInTheDocument();
    expect(screen.getByText(/Seen by Bob/)).toBeInTheDocument();

    rerender(<MessageList {...props} receipts={[watermark(BOB, { read: mine }), watermark('cat', { read: mine })]} />);
    expect(screen.getByText('Seen by everyone')).toBeInTheDocument();
  });

  it('offers Retry and Delete under a message that failed to send', async () => {
    const onRetryMessage = vi.fn();
    const onDiscardMessage = vi.fn();
    const failed = msg({ _id: 'temp_k1', senderId: ME, text: 'oops', _optimistic: true, _failed: true });
    const { user } = renderList({ messages: [failed], members, onRetryMessage, onDiscardMessage });

    expect(screen.getByRole('alert')).toHaveTextContent('Not sent.');
    expect(rowOf('oops')).not.toHaveClass('opacity-60');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onRetryMessage).toHaveBeenCalledWith('temp_k1');
    expect(onDiscardMessage).toHaveBeenCalledWith('temp_k1');
  });

  it("shows no status under other people's messages", () => {
    const { container } = renderList({ messages: [msg({ text: 'from bob' })], members, receipts: [] });
    expect(container.querySelector('[data-status]')).toBeNull();
  });
});

describe('MessageList – unread summary (AI)', () => {
  it('marks the unread block only when there are more than 10 unread messages', () => {
    const { unmount } = renderList({ messages: conversation(15), initialUnreadCount: 10 });
    expect(screen.queryByText(/unread messages/)).not.toBeInTheDocument();
    unmount();

    renderList({ messages: conversation(15), initialUnreadCount: 12 });
    expect(screen.getByText('There are 12 unread messages')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Summarize unread messages' })).toBeInTheDocument();
  });

  it('summarizes the unread block, suggests replies and applies the chosen one', async () => {
    summarizeChat.mockResolvedValue({ summaryBullets: ['Bob asked about the meeting'] });
    suggestChatReplies.mockResolvedValue({ replies: ['Sure!', 'Not today', 'Let me check'] });
    const onApplySuggestedReply = vi.fn();
    const { user } = renderList({ messages: conversation(15), initialUnreadCount: 12, onApplySuggestedReply });

    await user.click(screen.getByRole('button', { name: 'Summarize unread messages' }));

    expect(summarizeChat).toHaveBeenCalledWith({ conversationId: 'c1', endMessageId: 'm15', maxMessages: 12 });
    expect(await screen.findByText('Bob asked about the meeting')).toBeInTheDocument();
    expect(screen.getByText('12 unread messages')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Suggest response' }));
    await user.click(await screen.findByRole('button', { name: /Not today/ }));

    expect(onApplySuggestedReply).toHaveBeenCalledWith('Not today');
    // Picking a reply closes the panel and dismisses the unread markers.
    expect(screen.queryByText('Bob asked about the meeting')).not.toBeInTheDocument();
    expect(screen.queryByText('There are 12 unread messages')).not.toBeInTheDocument();
  });

  it('summarizes from a chosen message to the latest one', async () => {
    summarizeChat.mockResolvedValue({ summaryBullets: ['Recap'] });
    const { user } = renderList({ messages: conversation(4) });

    await user.click(within(rowOf('message 2')).getByRole('button', { name: 'Open message actions' }));
    await user.click(screen.getByRole('button', { name: 'Summarize from here' }));

    expect(summarizeChat).toHaveBeenCalledWith({ conversationId: 'c1', startMessageId: 'm2', endMessageId: 'm4' });
    expect(await screen.findByText('Recap')).toBeInTheDocument();
    expect(screen.getByText('Summary from here')).toBeInTheDocument();
  });

  it('closes the panel and shows a toast when summarizing fails', async () => {
    summarizeChat.mockRejectedValue(new Error('AI is unavailable'));
    const { user } = renderList({ messages: conversation(15), initialUnreadCount: 12 });

    await user.click(screen.getByRole('button', { name: 'Summarize unread messages' }));

    expect(toast.error).toHaveBeenCalledWith('AI is unavailable');
    expect(screen.queryByText('Unread summary')).not.toBeInTheDocument();
  });
});
