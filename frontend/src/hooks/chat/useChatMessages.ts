import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteChatMessage,
  getChatMessages,
  markChatConversationRead,
  sendChatImage,
  sendChatMessage,
} from "../../lib/api";
import {
  MAX_MESSAGE_PAGE_LIMIT,
  MESSAGE_PAGE_LIMIT,
  appendMessageOnce,
  applyDeletedMessageIds,
  createClientMessageId,
  createLatestOnlyRunner,
  getDeletedMessagePatch,
  getInitialPageLimit,
  getNewestCursor,
  mergeNewerMessages,
  mergeOlderMessages,
  replaceWithLatestPage,
} from "../../lib/chat";
import { getErrorMessage } from "../../lib/errors";
import { getAuthenticatedSocket } from "../../lib/socket";
import type {
  ChatMessage,
  ChatMessageEventPayload,
  Conversation,
  Id,
  MessagePageInfo,
  MessageType,
} from "../../types";

interface UseChatMessagesOptions {
  activeThreadId: Id | null | undefined;
  selectedChat: Pick<Conversation, "unread"> | null | undefined;
  currentUserId: Id | null | undefined;
  onClearRemoteTypingUser?: (userId: string) => void;
}

/** What is loaded of one conversation: a contiguous run of messages ending at the newest. */
interface ThreadTimeline {
  messages: ChatMessage[];
  hasOlder: boolean;
  /** Cursor of the oldest loaded message, for the next "older" page. */
  olderCursor: string | null;
  /**
   * Server time of the last sync that reflected the whole loaded run. Deletions after
   * it may have been missed (socket down) and are asked for on the next sync.
   */
  syncedAt: string | null;
  /**
   * Created when a message arrives (socket or optimistic send) before the first page
   * did. Its messages are merged into that page instead of being dropped.
   */
  isPlaceholder?: boolean;
}

type MessagesUpdater = (prevMessages: ChatMessage[]) => ChatMessage[];

const EMPTY_TIMELINE: ThreadTimeline = { messages: [], hasOlder: false, olderCursor: null, syncedAt: null };

function readHasOlder(pageInfo: Partial<MessagePageInfo> | undefined): boolean {
  return Boolean(pageInfo?.hasOlder ?? pageInfo?.hasMore);
}

function readOlderCursor(pageInfo: Partial<MessagePageInfo> | undefined): string | null {
  return pageInfo?.startCursor ?? pageInfo?.nextBefore ?? null;
}

function isAbortError(err: unknown): boolean {
  const name = (err as { name?: string } | null)?.name;
  return name === "CanceledError" || name === "AbortError";
}

/** Placeholder shown immediately while the real message is being sent. */
function buildOptimisticMessage({
  clientMessageId,
  conversationId,
  senderId,
  type,
  text,
  imageUrl,
}: {
  clientMessageId: string;
  conversationId: Id;
  senderId: Id | null | undefined;
  type: MessageType;
  text: string;
  imageUrl: string;
}): ChatMessage {
  const now = new Date().toISOString();
  const tempId = `temp_${clientMessageId}`;
  return {
    _id: tempId,
    id: tempId,
    conversationId,
    senderId: senderId ?? "",
    senderName: "",
    senderAvatar: "",
    text,
    type,
    imageUrl,
    call: null,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    clientMessageId,
    _optimistic: true,
  };
}

/** What a pending message needs to be sent again. */
type PendingSend =
  | { threadId: string; kind: "text"; text: string }
  | { threadId: string; kind: "image"; file: File; objectUrl: string };

/**
 * Messages of the open conversation, cursor-paginated.
 *
 * - Every conversation opened in this session keeps its loaded timeline in memory.
 *   Reopening one shows it instantly, then fetches only what is newer (`after` the
 *   newest cursor). If it is too far behind to stitch, it restarts from the newest page.
 * - Scrolling up loads `before` the oldest cursor; one request at a time.
 * - Socket events update the cached timeline of any conversation, not only the open
 *   one, and a socket reconnect triggers the same catch-up for the open one.
 * - Async results are written to the conversation that asked for them, so switching
 *   chats mid-request can never put messages into the wrong one.
 */
export function useChatMessages({
  activeThreadId,
  selectedChat,
  currentUserId,
  onClearRemoteTypingUser,
}: UseChatMessagesOptions) {
  // The timeline on screen, tagged with its thread so a render right after a switch
  // (before the effects below have run) never shows one chat's messages under another.
  const [view, setView] = useState<{ threadId: string | null; timeline: ThreadTimeline }>({
    threadId: null,
    timeline: EMPTY_TIMELINE,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [error, setError] = useState("");
  const [olderError, setOlderError] = useState("");

  const cacheRef = useRef(new Map<string, ThreadTimeline>());
  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeThreadId ? String(activeThreadId) : null;
  const olderRequestRef = useRef<AbortController | null>(null);
  // The unread count is captured once per thread switch, in render, so it marks where
  // unread messages started even after opening the chat resets it to 0.
  const initialUnreadCountRef = useRef(0);
  const unreadCapturedForRef = useRef<string | null>(null);
  if (unreadCapturedForRef.current !== activeIdRef.current) {
    unreadCapturedForRef.current = activeIdRef.current;
    initialUnreadCountRef.current = selectedChat?.unread ?? 0;
  }

  // Read receipts. One PATCH per thread at a time; reads requested meanwhile collapse
  // into one follow-up for the newest message, so a slow request can never land after
  // (and undo) a newer one. While the tab is hidden nothing counts as read: the latest
  // request is parked and sent when the user comes back.
  const readRunnerRef = useRef(createLatestOnlyRunner<Id>((threadId, upToMessageId) => (
    markChatConversationRead({ conversationId: threadId, upToMessageId })
  )));
  const parkedReadRef = useRef<{ threadId: string; messageId: Id } | null>(null);

  const requestRead = useCallback((threadId: string, messageId: Id) => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      parkedReadRef.current = { threadId, messageId };
      return;
    }
    parkedReadRef.current = null;
    readRunnerRef.current.run(threadId, messageId);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const parked = parkedReadRef.current;
      if (document.visibilityState !== "visible" || !parked) return;
      // Only if the user is back on the chat the read was for.
      if (parked.threadId === activeIdRef.current) requestRead(parked.threadId, parked.messageId);
      else parkedReadRef.current = null;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [requestRead]);

  const onClearRemoteTypingUserRef = useRef(onClearRemoteTypingUser);
  onClearRemoteTypingUserRef.current = onClearRemoteTypingUser;

  const getUsableCache = (threadId: string | null): ThreadTimeline | undefined => {
    const cached = threadId ? cacheRef.current.get(threadId) : undefined;
    return cached && !cached.isPlaceholder ? cached : undefined;
  };

  /** The cache is the source of truth; the open thread's entry is mirrored into state. */
  const writeThread = useCallback((
    threadId: string,
    updater: (current: ThreadTimeline | undefined) => ThreadTimeline | undefined,
  ) => {
    const next = updater(cacheRef.current.get(threadId));
    if (!next) return;
    cacheRef.current.set(threadId, next);
    if (threadId === activeIdRef.current) setView({ threadId, timeline: next });
  }, []);

  const patchMessages = useCallback((threadId: string, updater: MessagesUpdater) => {
    writeThread(threadId, (current) => {
      if (current) return { ...current, messages: updater(current.messages) };
      // A thread that was never loaded is fetched fresh when opened; only the open
      // one (still on its first request) needs a placeholder to hold the update.
      if (threadId !== activeIdRef.current) return undefined;
      return { ...EMPTY_TIMELINE, isPlaceholder: true, messages: updater([]) };
    });
  }, [writeThread]);

  /**
   * Brings a thread up to date: fetch what is newer than its newest cursor plus what
   * was deleted since its last sync, or load the newest page if it is too far behind.
   */
  const syncThread = useCallback(async (
    threadId: string,
    { signal, latestLimit }: { signal?: AbortSignal; latestLimit: number },
  ) => {
    const cached = cacheRef.current.get(threadId);
    const newestCursor = cached && !cached.isPlaceholder ? getNewestCursor(cached.messages) : null;

    if (newestCursor) {
      const data = await getChatMessages({
        conversationId: threadId,
        limit: MAX_MESSAGE_PAGE_LIMIT,
        after: newestCursor,
        deletedSince: cached?.syncedAt,
        signal,
      });
      if (!data?.pageInfo?.hasNewer && !data?.deletedTruncated) {
        writeThread(threadId, (current) => current && {
          ...current,
          messages: applyDeletedMessageIds(
            mergeNewerMessages(current.messages, data?.messages || []),
            data?.deletedMessageIds,
          ),
          syncedAt: data?.serverTime ?? current.syncedAt,
        });
        return;
      }
      // Too far behind (in new or deleted messages): start again from the newest page.
    }

    const data = await getChatMessages({ conversationId: threadId, limit: latestLimit, signal });
    writeThread(threadId, (current) => ({
      messages: replaceWithLatestPage(current?.messages || [], data?.messages || []),
      hasOlder: readHasOlder(data?.pageInfo),
      olderCursor: readOlderCursor(data?.pageInfo),
      syncedAt: data?.serverTime ?? null,
    }));
  }, [writeThread]);

  // Open a thread: show what is cached right away, then sync it in the background.
  useEffect(() => {
    olderRequestRef.current?.abort();
    olderRequestRef.current = null;
    setIsLoadingOlder(false);
    setOlderError("");
    setError("");

    if (!activeThreadId) {
      setView({ threadId: null, timeline: EMPTY_TIMELINE });
      setIsLoading(false);
      return undefined;
    }

    const threadId = String(activeThreadId);
    const cached = getUsableCache(threadId);
    const hasUsableCache = Boolean(cached);
    setView({ threadId, timeline: cached || EMPTY_TIMELINE });
    setIsLoading(!hasUsableCache);

    const controller = new AbortController();
    syncThread(threadId, {
      signal: controller.signal,
      latestLimit: getInitialPageLimit(initialUnreadCountRef.current),
    })
      .catch((err) => {
        if (controller.signal.aborted || isAbortError(err)) return;
        // With a cached timeline on screen a failed refresh is not worth an error screen.
        if (!hasUsableCache) setError(getErrorMessage(err, "Failed to load messages"));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [activeThreadId, syncThread]);

  const handleLoadOlderMessages = useCallback(async () => {
    const threadId = activeIdRef.current;
    const current = threadId ? cacheRef.current.get(threadId) : undefined;
    // The ref (not state) guards against the burst of scroll events before a re-render.
    if (!threadId || !current?.hasOlder || !current.olderCursor || olderRequestRef.current) return;

    const controller = new AbortController();
    olderRequestRef.current = controller;
    setIsLoadingOlder(true);
    setOlderError("");

    try {
      const data = await getChatMessages({
        conversationId: threadId,
        limit: MESSAGE_PAGE_LIMIT,
        before: current.olderCursor,
        signal: controller.signal,
      });

      writeThread(threadId, (latest) => latest && {
        ...latest,
        messages: mergeOlderMessages(latest.messages, data?.messages || []),
        hasOlder: readHasOlder(data?.pageInfo),
        olderCursor: readOlderCursor(data?.pageInfo) ?? latest.olderCursor,
      });
    } catch (err) {
      if (!controller.signal.aborted && !isAbortError(err)) {
        setOlderError(getErrorMessage(err, "Couldn't load older messages"));
      }
    } finally {
      if (olderRequestRef.current === controller) {
        olderRequestRef.current = null;
        setIsLoadingOlder(false);
      }
    }
  }, [writeThread]);

  // Live updates, for every cached conversation.
  useEffect(() => {
    const socket = getAuthenticatedSocket();
    if (!socket) return undefined;

    const handleMessageCreated = (payload: Partial<ChatMessageEventPayload> | undefined) => {
      const message = payload?.message;
      if (!payload?.conversationId || !message) return;

      const threadId = String(payload.conversationId);
      patchMessages(threadId, (prevMessages) => appendMessageOnce(prevMessages, message));

      if (threadId !== activeIdRef.current) return;
      onClearRemoteTypingUserRef.current?.(String(message.senderId));
      if (message.senderId !== currentUserId) {
        // Up to this message, which is now on screen; not "everything".
        requestRead(threadId, message._id);
      }
    };

    const handleMessageDeleted = (payload: Partial<ChatMessageEventPayload> | undefined) => {
      const deletedMessage = payload?.message;
      if (!payload?.conversationId || !deletedMessage) return;

      patchMessages(String(payload.conversationId), (prevMessages) => (
        prevMessages.map((message) => (
          message._id === deletedMessage._id ? { ...message, ...deletedMessage } : message
        ))
      ));
    };

    // Events emitted while disconnected are lost: fetch what was missed.
    const handleReconnect = () => {
      const threadId = activeIdRef.current;
      if (!threadId) return;
      syncThread(threadId, { latestLimit: MESSAGE_PAGE_LIMIT }).catch(() => {});
    };

    socket.on("chat:message_created", handleMessageCreated);
    socket.on("chat:message_deleted", handleMessageDeleted);
    socket.io.on("reconnect", handleReconnect);

    return () => {
      socket.off("chat:message_created", handleMessageCreated);
      socket.off("chat:message_deleted", handleMessageDeleted);
      socket.io.off("reconnect", handleReconnect);
    };
  }, [currentUserId, patchMessages, requestRead, syncThread]);

  // --- Sending -----------------------------------------------------------------
  //
  // Each outgoing message gets an idempotency key (clientMessageId) when it is created
  // and keeps it across retries, so a retry after a timeout whose request did reach the
  // server returns the stored message instead of a duplicate. The pending bubble is
  // replaced in place by the server copy, from the HTTP response or the socket event,
  // whichever comes first. A failed send stays on screen, marked failed, until the
  // user retries or discards it; nothing typed is ever silently lost.
  const pendingSendsRef = useRef(new Map<string, PendingSend>());
  const inFlightRef = useRef(new Set<string>());

  const attemptSend = useCallback(async (clientMessageId: string) => {
    const pending = pendingSendsRef.current.get(clientMessageId);
    // One attempt at a time per message: a double-clicked Retry is a no-op.
    if (!pending || inFlightRef.current.has(clientMessageId)) return;
    inFlightRef.current.add(clientMessageId);

    const tempId = `temp_${clientMessageId}`;
    patchMessages(pending.threadId, (prev) => prev.map((message) => (
      message._id === tempId ? { ...message, _failed: false } : message
    )));

    try {
      const data = pending.kind === "text"
        ? await sendChatMessage({ conversationId: pending.threadId, text: pending.text, clientMessageId })
        : await sendChatImage({ conversationId: pending.threadId, file: pending.file, clientMessageId });

      if (pending.kind === "image") URL.revokeObjectURL(pending.objectUrl);
      pendingSendsRef.current.delete(clientMessageId);
      if (data?.message) {
        patchMessages(pending.threadId, (prev) => {
          // The socket copy may already have taken the pending one's place.
          if (prev.some((message) => message._id === data.message._id)) {
            return prev.filter((message) => message._id !== tempId);
          }
          return appendMessageOnce(prev, data.message);
        });
      }
    } catch {
      // Still pending if it was not discarded meanwhile.
      if (pendingSendsRef.current.has(clientMessageId)) {
        patchMessages(pending.threadId, (prev) => prev.map((message) => (
          message._id === tempId ? { ...message, _failed: true } : message
        )));
      }
    } finally {
      inFlightRef.current.delete(clientMessageId);
    }
  }, [patchMessages]);

  const enqueueSend = (pending: PendingSend, optimistic: ChatMessage) => {
    const clientMessageId = optimistic.clientMessageId as string;
    pendingSendsRef.current.set(clientMessageId, pending);
    patchMessages(pending.threadId, (prev) => appendMessageOnce(prev, optimistic));
    return attemptSend(clientMessageId);
  };

  const handleSendMessage = async (text: string) => {
    if (!activeThreadId) return;
    const threadId = String(activeThreadId);
    const clientMessageId = createClientMessageId();

    await enqueueSend({ threadId, kind: "text", text }, buildOptimisticMessage({
      clientMessageId,
      conversationId: threadId,
      senderId: currentUserId,
      type: "text",
      text,
      imageUrl: "",
    }));
  };

  const handleAttachImage = async (file: File) => {
    if (!activeThreadId) return;
    const threadId = String(activeThreadId);
    const clientMessageId = createClientMessageId();
    const objectUrl = URL.createObjectURL(file);

    await enqueueSend({ threadId, kind: "image", file, objectUrl }, buildOptimisticMessage({
      clientMessageId,
      conversationId: threadId,
      senderId: currentUserId,
      type: "image",
      text: "",
      imageUrl: objectUrl,
    }));
  };

  /** Sends a failed message again, with the same idempotency key. */
  const handleRetryMessage = useCallback((tempId: Id) => {
    const clientMessageId = String(tempId).replace(/^temp_/, "");
    void attemptSend(clientMessageId);
  }, [attemptSend]);

  /** Drops a failed message. If an attempt is still in flight it may yet arrive. */
  const handleDiscardMessage = useCallback((tempId: Id) => {
    const clientMessageId = String(tempId).replace(/^temp_/, "");
    const pending = pendingSendsRef.current.get(clientMessageId);
    if (!pending) return;
    pendingSendsRef.current.delete(clientMessageId);
    if (pending.kind === "image") URL.revokeObjectURL(pending.objectUrl);
    patchMessages(pending.threadId, (prev) => prev.filter((message) => message._id !== tempId));
  }, [patchMessages]);

  const handleDeleteMessage = async (messageId: Id) => {
    if (!activeThreadId) return;
    const threadId = String(activeThreadId);

    await deleteChatMessage({ messageId });
    patchMessages(threadId, (prevMessages) => prevMessages.map(getDeletedMessagePatch(messageId)));
  };

  const activeId = activeIdRef.current;
  const isViewCurrent = view.threadId === activeId;
  const shownTimeline = isViewCurrent ? view.timeline : getUsableCache(activeId) || EMPTY_TIMELINE;

  return {
    messages: shownTimeline.messages,
    isLoading: isViewCurrent ? isLoading : Boolean(activeId) && !getUsableCache(activeId),
    isLoadingOlder: isViewCurrent && isLoadingOlder,
    hasOlderMessages: shownTimeline.hasOlder,
    olderError: isViewCurrent ? olderError : "",
    error: isViewCurrent ? error : "",
    initialUnreadCount: initialUnreadCountRef.current,
    handleLoadOlderMessages,
    handleSendMessage,
    handleDeleteMessage,
    handleAttachImage,
    handleRetryMessage,
    handleDiscardMessage,
  };
}
