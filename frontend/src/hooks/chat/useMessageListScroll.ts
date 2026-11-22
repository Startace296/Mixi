import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ChatMessage, Id } from "../../types";

/** Start fetching the older page this far before the user reaches the top. */
export const LOAD_OLDER_THRESHOLD_PX = 600;
/** Within this distance of the bottom the list "sticks" to new messages. */
const STICK_TO_BOTTOM_PX = 80;
/** Show the jump-to-latest button once the user is this far up. */
const SHOW_JUMP_BUTTON_PX = 400;
/** Room left above the first unread message when a chat opens on it. */
const UNREAD_TARGET_MARGIN_PX = 12;

interface UseMessageListScrollOptions {
  threadId: Id | null | undefined;
  messages: Pick<ChatMessage, "_id" | "senderId">[];
  currentUserId: Id | null | undefined;
  hasOlderMessages: boolean;
  isLoadingOlder: boolean;
  /** False after a failed older load: retrying is left to the user. */
  canAutoLoadOlder?: boolean;
  onLoadOlderMessages?: () => void;
  /** Message to open the chat on (the first unread one) instead of the bottom. */
  initialTargetId?: Id | null;
}

/** The message at the top edge of the viewport and how far below that edge it starts. */
interface ScrollAnchor {
  id: string;
  offset: number;
}

const quote = (id: string) => `"${id.replace(/"/g, '\\"')}"`;

/** A message's whole row (with its date divider / unread banner), for the opening target. */
function findMessageElement(list: HTMLElement, id: string): HTMLElement | null {
  return list.querySelector<HTMLElement>(`[data-message-id=${quote(id)}]`);
}

/**
 * The bubble alone, which is what anchoring tracks. Not the whole row: the row also
 * holds the date divider, and prepending older messages of the same day moves that
 * divider to an older row, so a row-anchored view would jump by the divider's height.
 */
function findAnchorElement(list: HTMLElement, id: string): HTMLElement | null {
  return list.querySelector<HTMLElement>(`[data-scroll-anchor=${quote(id)}]`);
}

/** Binary search: bubbles are in document order, so their bottoms only increase. */
function findFirstVisibleRow(list: HTMLElement): HTMLElement | null {
  const rows = list.querySelectorAll<HTMLElement>("[data-scroll-anchor]");
  const viewportTop = list.getBoundingClientRect().top;
  let low = 0;
  let high = rows.length - 1;
  let found: HTMLElement | null = null;

  while (low <= high) {
    const middle = (low + high) >> 1;
    if (rows[middle].getBoundingClientRect().bottom > viewportTop) {
      found = rows[middle];
      high = middle - 1;
    } else {
      low = middle + 1;
    }
  }
  return found;
}

function distanceFromBottom(list: HTMLElement): number {
  return list.scrollHeight - list.scrollTop - list.clientHeight;
}

/**
 * Scroll behaviour of a chat timeline.
 *
 * Position is kept by anchoring to a message, not to scroll offsets: whenever content
 * changes size (an older page prepended, an image above finishing loading, a new
 * message below), the message that was at the top of the viewport is put back exactly
 * where it was. Native `overflow-anchor` is turned off on the list so the browser does
 * not correct the same shift a second time.
 *
 * When the user is at the bottom the list sticks there instead, so incoming messages
 * scroll into view; when they have scrolled up, incoming messages are counted for the
 * "new messages" button and the view stays put. Sending a message always jumps down.
 */
export function useMessageListScroll({
  threadId,
  messages,
  currentUserId,
  hasOlderMessages,
  isLoadingOlder,
  canAutoLoadOlder = true,
  onLoadOlderMessages,
  initialTargetId = null,
}: UseMessageListScrollOptions) {
  const listRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<ScrollAnchor | null>(null);
  const stickToBottomRef = useRef(true);
  const positionedThreadRef = useRef<Id | null | undefined>(undefined);
  const lastMessageIdRef = useRef<string | null>(null);

  const [showJumpButton, setShowJumpButton] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);

  const captureAnchor = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const row = findFirstVisibleRow(list);
    anchorRef.current = row?.dataset.scrollAnchor
      ? { id: row.dataset.scrollAnchor, offset: row.getBoundingClientRect().top - list.getBoundingClientRect().top }
      : null;
  }, []);

  /** Undo whatever shift the last content change caused. */
  const restorePosition = useCallback(() => {
    const list = listRef.current;
    if (!list) return;

    if (stickToBottomRef.current) {
      list.scrollTop = list.scrollHeight;
      return;
    }

    const anchor = anchorRef.current;
    const element = anchor ? findAnchorElement(list, anchor.id) : null;
    if (!anchor || !element) return;

    const shift = element.getBoundingClientRect().top - list.getBoundingClientRect().top - anchor.offset;
    if (Math.abs(shift) >= 1) list.scrollTop += shift;
  }, []);

  const updateBottomState = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const distance = distanceFromBottom(list);
    stickToBottomRef.current = distance <= STICK_TO_BOTTOM_PX;
    setShowJumpButton(distance > SHOW_JUMP_BUTTON_PX);
    if (stickToBottomRef.current) setUnseenCount(0);
  }, []);

  // Runs before paint on every change to the rendered messages, so no frame ever shows
  // the list at the wrong position.
  useLayoutEffect(() => {
    const list = listRef.current;
    const lastMessage = messages[messages.length - 1];
    const lastId = lastMessage ? String(lastMessage._id) : null;

    if (positionedThreadRef.current !== threadId) {
      // New thread: wait for its first messages, then open at the first unread or the bottom.
      if (!list || !messages.length) return;
      positionedThreadRef.current = threadId;
      lastMessageIdRef.current = lastId;
      setUnseenCount(0);

      const target = initialTargetId ? findMessageElement(list, String(initialTargetId)) : null;
      if (target) {
        list.scrollTop += target.getBoundingClientRect().top - list.getBoundingClientRect().top - UNREAD_TARGET_MARGIN_PX;
      } else {
        list.scrollTop = list.scrollHeight;
      }
      updateBottomState();
      captureAnchor();
      return;
    }

    if (lastId && lastId !== lastMessageIdRef.current) {
      // Something was added at the bottom (not an older page, which only changes the top).
      const previousIndex = messages.findIndex((message) => String(message._id) === lastMessageIdRef.current);
      const added = previousIndex >= 0 ? messages.slice(previousIndex + 1) : [lastMessage];
      const sentByMe = added.some((message) => message.senderId === currentUserId);

      if (sentByMe) {
        stickToBottomRef.current = true;
      } else if (!stickToBottomRef.current) {
        setUnseenCount((count) => count + added.length);
      }
    }
    lastMessageIdRef.current = lastId;

    restorePosition();
    updateBottomState();
    captureAnchor();
  }, [messages, threadId, currentUserId, initialTargetId, restorePosition, updateBottomState, captureAnchor]);

  // Size changes that happen without a re-render (images and fonts finishing loading).
  // The observed content element only exists once there are messages.
  const hasMessages = messages.length > 0;
  useEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(() => {
      restorePosition();
      captureAnchor();
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [threadId, hasMessages, restorePosition, captureAnchor]);

  const maybeLoadOlder = useCallback(() => {
    const list = listRef.current;
    if (!list || positionedThreadRef.current !== threadId) return;
    if (!hasOlderMessages || isLoadingOlder || !canAutoLoadOlder || !onLoadOlderMessages) return;
    if (list.scrollTop > LOAD_OLDER_THRESHOLD_PX) return;
    onLoadOlderMessages();
  }, [threadId, hasOlderMessages, isLoadingOlder, canAutoLoadOlder, onLoadOlderMessages]);

  // After each page lands, keep loading while the top is still within reach. This also
  // fills a viewport that one page is too short to scroll.
  useEffect(() => {
    maybeLoadOlder();
  }, [messages, maybeLoadOlder]);

  const handleScroll = () => {
    updateBottomState();
    captureAnchor();
    maybeLoadOlder();
  };

  const scrollToBottom = () => {
    const list = listRef.current;
    if (!list) return;
    stickToBottomRef.current = true;
    setUnseenCount(0);
    setShowJumpButton(false);
    // Smooth only for short trips; animating through hundreds of messages feels slow.
    const isFar = distanceFromBottom(list) > list.clientHeight * 3;
    list.scrollTo({ top: list.scrollHeight, behavior: isFar ? "auto" : "smooth" });
  };

  return {
    listRef,
    contentRef,
    handleScroll,
    scrollToBottom,
    showJumpButton: showJumpButton || unseenCount > 0,
    unseenCount,
  };
}
