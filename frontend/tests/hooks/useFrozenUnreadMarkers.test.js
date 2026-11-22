import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useFrozenUnreadMarkers } from '../../src/hooks/chat';
import { UNREAD_SUMMARIZE_THRESHOLD } from '../../src/lib/chat';

const makeMessages = (count, prefix = 'm') =>
  Array.from({ length: count }, (_, index) => ({ _id: `${prefix}${index + 1}` }));

function renderMarkers(props) {
  return renderHook((hookProps) => useFrozenUnreadMarkers(hookProps), {
    initialProps: { threadId: 't1', unreadUiDismissed: false, ...props },
  });
}

describe('useFrozenUnreadMarkers', () => {
  it('shows no markers at or below the threshold', () => {
    const { result } = renderMarkers({
      messages: makeMessages(20),
      initialUnreadCount: UNREAD_SUMMARIZE_THRESHOLD,
    });
    expect(result.current.markers).toBeNull();
    expect(result.current.showUnreadUi).toBeFalsy();
  });

  it('marks the first and last unread message above the threshold', () => {
    const { result } = renderMarkers({ messages: makeMessages(20), initialUnreadCount: 12 });

    expect(result.current.markers).toEqual({ firstId: 'm9', lastId: 'm20', count: 12 });
    expect(result.current.showUnreadUi).toBe(true);
  });

  it('waits until enough messages are loaded', () => {
    const { result, rerender } = renderMarkers({ messages: makeMessages(5), initialUnreadCount: 12 });
    expect(result.current.markers).toBeNull();

    rerender({ threadId: 't1', unreadUiDismissed: false, messages: makeMessages(15), initialUnreadCount: 12 });
    expect(result.current.markers).toEqual({ firstId: 'm4', lastId: 'm15', count: 12 });
  });

  it('stays frozen when new messages arrive or the unread count drops', () => {
    const { result, rerender } = renderMarkers({ messages: makeMessages(15), initialUnreadCount: 12 });
    const frozen = result.current.markers;

    rerender({ threadId: 't1', unreadUiDismissed: false, messages: makeMessages(18), initialUnreadCount: 0 });

    expect(result.current.markers).toEqual(frozen);
  });

  it('hides the UI once dismissed, but keeps the markers', () => {
    const { result, rerender } = renderMarkers({ messages: makeMessages(15), initialUnreadCount: 12 });
    rerender({ threadId: 't1', unreadUiDismissed: true, messages: makeMessages(15), initialUnreadCount: 12 });

    expect(result.current.showUnreadUi).toBe(false);
    expect(result.current.markers).not.toBeNull();
  });

  it('recomputes for a different conversation', () => {
    const { result, rerender } = renderMarkers({ messages: makeMessages(15), initialUnreadCount: 12 });

    rerender({ threadId: 't2', unreadUiDismissed: false, messages: makeMessages(3, 'x'), initialUnreadCount: 0 });
    expect(result.current.markers).toBeNull();
  });
});
