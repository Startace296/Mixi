import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  compareTimelineKeys,
  createDeliveryAcker,
  createLatestOnlyRunner,
  getOutgoingStatus,
  mergeConversation,
  mergeReceipt,
  mergeReceipts,
} from '../../src/lib/chat';

const T = (second) => new Date(Date.UTC(2025, 0, 1, 10, 0, second)).toISOString();
// Object-id-like hex strings that sort in numeric order.
const oid = (n) => n.toString(16).padStart(24, '0');
const msg = (n, extra = {}) => ({ _id: oid(n), createdAt: T(n), ...extra });
const receipt = (userId, { delivered, read } = {}) => ({
  userId,
  deliveredAt: delivered ? T(delivered) : null,
  deliveredMessageId: delivered ? oid(delivered) : null,
  readAt: read ? T(read) : null,
  readMessageId: read ? oid(read) : null,
});

afterEach(() => vi.useRealTimers());

describe('timeline keys', () => {
  it('orders by time, then by id for the same millisecond, with nothing first', () => {
    expect(compareTimelineKeys({ at: T(1), id: oid(9) }, { at: T(2), id: oid(1) })).toBe(-1);
    expect(compareTimelineKeys({ at: T(1), id: oid(2) }, { at: T(1), id: oid(1) })).toBe(1);
    expect(compareTimelineKeys({ at: T(1), id: oid(1) }, { at: T(1), id: oid(1) })).toBe(0);
    expect(compareTimelineKeys({ at: null, id: null }, { at: T(0), id: oid(0) })).toBe(-1);
  });
});

describe('merging receipts', () => {
  it('keeps the furthest watermark of each kind, whatever order copies arrive in', () => {
    const a = receipt('bob', { delivered: 5, read: 2 });
    const b = receipt('bob', { delivered: 3, read: 4 });
    expect(mergeReceipt(a, b)).toEqual(receipt('bob', { delivered: 5, read: 4 }));
    expect(mergeReceipt(b, a)).toEqual(mergeReceipt(a, b));
    expect(mergeReceipt(a, a)).toEqual(a);
  });

  it('merges lists by member and returns the same array when nothing moved', () => {
    const current = [receipt('bob', { delivered: 5 }), receipt('cat', { read: 1 })];
    expect(mergeReceipts(current, [receipt('bob', { delivered: 2 })])).toBe(current);

    const next = mergeReceipts(current, [receipt('bob', { read: 6 }), receipt('dan', { delivered: 1 })]);
    expect(next.find((r) => r.userId === 'bob')).toEqual(receipt('bob', { delivered: 5, read: 6 }));
    expect(next.map((r) => r.userId).sort()).toEqual(['bob', 'cat', 'dan']);
  });

  it('a stale conversation payload cannot roll the ticks back', () => {
    const held = { id: 'c1', name: 'Bob', receipts: [receipt('bob', { read: 9 })] };
    const stale = { id: 'c1', name: 'Bob B.', receipts: [receipt('bob', { delivered: 7 })] };
    const merged = mergeConversation(held, stale);
    expect(merged.name).toBe('Bob B.');
    expect(merged.receipts[0]).toMatchObject({ readMessageId: oid(9), deliveredMessageId: oid(7) });
  });
});

describe('outgoing message status', () => {
  const direct = { memberIds: ['me', 'bob'], currentUserId: 'me' };

  it('walks sending → sent → delivered → read in a direct chat', () => {
    expect(getOutgoingStatus(msg(5, { _optimistic: true }), { ...direct, receipts: [] }).status).toBe('sending');
    expect(getOutgoingStatus(msg(5), { ...direct, receipts: [receipt('bob', { delivered: 4 })] }).status).toBe('sent');
    expect(getOutgoingStatus(msg(5), { ...direct, receipts: [receipt('bob', { delivered: 5 })] }).status).toBe('delivered');
    expect(getOutgoingStatus(msg(5), { ...direct, receipts: [receipt('bob', { delivered: 9, read: 5 })] }).status).toBe('read');
  });

  it('treats read as delivered even if the delivery watermark arrived later or not at all', () => {
    expect(getOutgoingStatus(msg(5), { ...direct, receipts: [receipt('bob', { read: 6 })] }).status).toBe('read');
  });

  it('ignores my own receipt and needs everyone else in a group', () => {
    const group = { memberIds: ['me', 'bob', 'cat'], currentUserId: 'me' };
    const partial = getOutgoingStatus(msg(5), {
      ...group,
      receipts: [receipt('me', { read: 9 }), receipt('bob', { read: 5 }), receipt('cat', { delivered: 5 })],
    });
    expect(partial).toEqual({ status: 'delivered', readBy: ['bob'] });

    const all = getOutgoingStatus(msg(5), {
      ...group,
      receipts: [receipt('bob', { read: 5 }), receipt('cat', { read: 8 })],
    });
    expect(all).toEqual({ status: 'read', readBy: ['bob', 'cat'] });
  });
});

describe('delivery acker', () => {
  it('turns a burst into one ack per conversation for the newest message', () => {
    vi.useFakeTimers();
    const send = vi.fn();
    const acker = createDeliveryAcker(send, { delayMs: 200 });

    acker.queue('c1', msg(1));
    acker.queue('c1', msg(3));
    acker.queue('c1', msg(2)); // out of order: behind what is pending
    acker.queue('c2', msg(1));
    expect(send).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(send.mock.calls).toEqual([['c1', oid(3)], ['c2', oid(1)]]);
  });

  it('never re-acks a message at or behind one already acked', () => {
    vi.useFakeTimers();
    const send = vi.fn();
    const acker = createDeliveryAcker(send, { delayMs: 50 });

    acker.queue('c1', msg(5));
    vi.advanceTimersByTime(50);
    acker.queue('c1', msg(5));
    acker.queue('c1', msg(4));
    vi.advanceTimersByTime(50);
    expect(send).toHaveBeenCalledTimes(1);

    acker.queue('c1', msg(6));
    acker.flush();
    expect(send).toHaveBeenLastCalledWith('c1', oid(6));
  });
});

describe('latest-only runner', () => {
  it('runs one call at a time per key and collapses the backlog into the latest', async () => {
    const resolvers = [];
    const task = vi.fn(() => new Promise((resolve) => resolvers.push(resolve)));
    const runner = createLatestOnlyRunner(task);

    runner.run('c1', 'm1');
    runner.run('c1', 'm2');
    runner.run('c1', 'm3');
    runner.run('c2', 'x1'); // other keys are independent
    expect(task.mock.calls).toEqual([['c1', 'm1'], ['c2', 'x1']]);

    resolvers[0]();
    await vi.waitFor(() => expect(task).toHaveBeenCalledTimes(3));
    expect(task.mock.calls[2]).toEqual(['c1', 'm3']);
  });

  it('keeps going after a failed run', async () => {
    const task = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(undefined);
    const runner = createLatestOnlyRunner(task);

    runner.run('c1', 'm1');
    runner.run('c1', 'm2');
    await vi.waitFor(() => expect(task).toHaveBeenLastCalledWith('c1', 'm2'));
  });
});
