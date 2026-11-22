import { describe, expect, it } from 'vitest';

import {
  MAX_MESSAGE_PAGE_LIMIT,
  appendMessageOnce,
  createClientMessageId,
  applyDeletedMessageIds,
  MESSAGE_PAGE_LIMIT,
  getInitialPageLimit,
  getNewestCursor,
  mergeNewerMessages,
  mergeOlderMessages,
  replaceWithLatestPage,
} from '../../src/lib/chat';

const at = (minute) => new Date(2025, 0, 1, 10, minute).toISOString();
const m = (id, minute, extra = {}) => ({ _id: id, createdAt: at(minute), cursor: `c-${id}`, ...extra });
const ids = (messages) => messages.map((message) => message._id);

describe('chat message pagination helpers', () => {
  it('prepends an older page without duplicating the overlap', () => {
    expect(ids(mergeOlderMessages([m('b', 2), m('c', 3)], [m('a', 1), m('b', 2)]))).toEqual(['a', 'b', 'c']);
  });

  it('appends a catch-up page but keeps messages still being sent last', () => {
    const current = [m('a', 1), m('tmp', 9, { _optimistic: true, cursor: null })];
    expect(ids(mergeNewerMessages(current, [m('a', 1), m('b', 2)]))).toEqual(['a', 'b', 'tmp']);
    expect(mergeNewerMessages(current, [])).toBe(current);
  });

  it('replaces a stale timeline with the newest page, keeping only what is newer or pending', () => {
    const stale = [m('old1', 1), m('old2', 2), m('live', 30), m('tmp', 31, { _optimistic: true })];
    const page = [m('p1', 20), m('p2', 21)];
    expect(ids(replaceWithLatestPage(stale, page))).toEqual(['p1', 'p2', 'live', 'tmp']);
    expect(ids(replaceWithLatestPage([m('live', 30)], []))).toEqual(['live']);
  });

  it('catches up from the newest confirmed message, skipping optimistic ones', () => {
    expect(getNewestCursor([m('a', 1), m('b', 2), m('tmp', 3, { _optimistic: true })])).toBe('c-b');
    expect(getNewestCursor([m('tmp', 3, { _optimistic: true })])).toBeNull();
  });

  it('sizes the first page to fit every unread message, within the server cap', () => {
    expect(getInitialPageLimit(0)).toBe(MESSAGE_PAGE_LIMIT);
    expect(getInitialPageLimit(40)).toBe(50);
    expect(getInitialPageLimit(500)).toBe(MAX_MESSAGE_PAGE_LIMIT);
  });

  it('blanks deleted messages and leaves the array alone when nothing changes', () => {
    const current = [m('a', 1, { text: 'hi' }), m('b', 2, { text: 'yo' })];
    const next = applyDeletedMessageIds(current, ['b', 'unknown']);
    expect(next.map((x) => [x._id, x.isDeleted ?? false, x.text])).toEqual([['a', false, 'hi'], ['b', true, '']]);
    expect(applyDeletedMessageIds(current, [])).toBe(current);
    expect(applyDeletedMessageIds(next, ['b'])).toBe(next);
  });

  it('puts the server copy of a pending message in its place, not at the end', () => {
    const pending = m('temp_k1', 5, { _optimistic: true, clientMessageId: 'k1' });
    const later = m('x', 6);
    const real = m('real', 5, { clientMessageId: 'k1' });
    expect(ids(appendMessageOnce([m('a', 1), pending, later], real))).toEqual(['a', 'real', 'x']);
    expect(ids(appendMessageOnce([m('a', 1)], real))).toEqual(['a', 'real']);
  });

  it('makes idempotency keys the server accepts', () => {
    const key = createClientMessageId();
    expect(key).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
    expect(createClientMessageId()).not.toBe(key);
  });
});
