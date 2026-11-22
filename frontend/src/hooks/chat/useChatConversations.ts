import { useEffect, useRef, useState } from "react";
import {
  createGroupConversation,
  getChatConversations,
  hideChatConversation,
} from "../../lib/api";
import { getConversationSortTime, mergeConversation, mergeConversationList, mergeReceipts } from "../../lib/chat";
import { getErrorMessage } from "../../lib/errors";
import { CHAT_SOCKET_EVENTS, PRESENCE_SOCKET_EVENTS, RECEIPT_SOCKET_EVENT, getAuthenticatedSocket } from "../../lib/socket";
import type {
  ChatConversationRemovedPayload,
  ChatReceiptUpdatedPayload,
  Conversation,
  Id,
  PresenceChangedPayload,
  SelectChatHandler,
} from "../../types";

interface UseChatConversationsOptions {
  selectedChatId: Id | null | undefined;
  onSelectChat: SelectChatHandler;
}

export function useChatConversations({ selectedChatId, onSelectChat }: UseChatConversationsOptions) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const hasLoadedOnceRef = useRef(false);
  // Latest list, for computing the merged copy handed to onSelectChat outside setState.
  const conversationsRef = useRef<Conversation[]>([]);
  conversationsRef.current = conversations;

  const findHeld = (id: Id) => conversationsRef.current.find((item) => item.id === id);

  useEffect(() => {
    let isMounted = true;

    async function loadConversations({ silent = false } = {}) {
      if (!hasLoadedOnceRef.current) setIsLoading(true);
      if (!silent) setError("");

      try {
        const data = await getChatConversations();
        if (!isMounted) return;
        // Receipt events that arrived while this request was in flight are newer than it.
        const nextConversations = mergeConversationList(conversationsRef.current, data?.conversations || []);

        setConversations(nextConversations);
        hasLoadedOnceRef.current = true;

        if (selectedChatId) {
          const matched = nextConversations.find((item) => item.id === selectedChatId);
          if (matched) onSelectChat(matched, false);
        }
      } catch (err) {
        if (isMounted && !silent) setError(getErrorMessage(err, "Failed to load conversations"));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadConversations();
    return () => {
      isMounted = false;
    };
  }, [onSelectChat, selectedChatId]);

  useEffect(() => {
    const socket = getAuthenticatedSocket();
    if (!socket) return undefined;

    const applyConversationUpdate = (conversation: Conversation | null | undefined): boolean => {
      if (!conversation?.id) return false;

      setConversations((prev) => {
        const index = prev.findIndex((item) => item.id === conversation.id);
        if (index === -1) return [conversation, ...prev];

        const next = [...prev];
        next[index] = mergeConversation(next[index], conversation);
        return next.sort((a, b) => getConversationSortTime(b) - getConversationSortTime(a));
      });

      if (selectedChatId === conversation.id) {
        onSelectChat(mergeConversation(findHeld(conversation.id), conversation), false);
      }
      return true;
    };

    const handleReceiptUpdated = (payload: Partial<ChatReceiptUpdatedPayload> | undefined) => {
      const { conversationId, receipt } = payload || {};
      if (!conversationId || !receipt?.userId) return;

      const withReceipt = (conversation: Conversation): Conversation => {
        const receipts = mergeReceipts(conversation.receipts, [receipt]);
        return receipts === conversation.receipts ? conversation : { ...conversation, receipts };
      };

      setConversations((prev) => prev.map((item) => (item.id === conversationId ? withReceipt(item) : item)));

      const held = findHeld(conversationId);
      if (held && selectedChatId === conversationId) {
        const updated = withReceipt(held);
        if (updated !== held) onSelectChat(updated, false);
      }
    };

    const handleChatEvent = (payload: { conversation?: Conversation | null } | undefined) => {
      if (!applyConversationUpdate(payload?.conversation)) {
        getChatConversations()
          .then((data) => setConversations((prev) => mergeConversationList(prev, data?.conversations || [])))
          .catch(() => {});
      }
    };

    const handleConversationRemoved = (payload: Partial<ChatConversationRemovedPayload> | undefined) => {
      if (!payload?.conversationId) return;

      // Updaters must stay pure (React may run them during render): the parent's
      // selection is changed outside, from the latest list.
      setConversations((prev) => prev.filter((conversation) => conversation.id !== payload.conversationId));
      if (selectedChatId === payload.conversationId) {
        const remaining = conversationsRef.current.filter((conversation) => conversation.id !== payload.conversationId);
        onSelectChat(remaining[0] || null, true);
      }
    };

    CHAT_SOCKET_EVENTS.forEach((eventName) => socket.on(eventName, handleChatEvent));
    socket.on("chat:conversation_removed", handleConversationRemoved);
    socket.on(RECEIPT_SOCKET_EVENT, handleReceiptUpdated);
    return () => {
      CHAT_SOCKET_EVENTS.forEach((eventName) => socket.off(eventName, handleChatEvent));
      socket.off("chat:conversation_removed", handleConversationRemoved);
      socket.off(RECEIPT_SOCKET_EVENT, handleReceiptUpdated);
    };
  }, [onSelectChat, selectedChatId]);

  useEffect(() => {
    if (!selectedChatId) return;
    setConversations((prev) => prev.map((item) => (
      item.id === selectedChatId ? { ...item, unread: 0 } : item
    )));
  }, [selectedChatId]);

  useEffect(() => {
    const socket = getAuthenticatedSocket();
    if (!socket) return undefined;

    const handlePresenceChanged = (payload: Partial<PresenceChangedPayload> | undefined) => {
      if (!payload?.userId) return;

      const withPresence = (conversation: Conversation): Conversation => (
        String(conversation.friendId) !== String(payload.userId)
          ? conversation
          : {
            ...conversation,
            presenceStatus: payload.status || "offline",
            lastActiveAt: payload.lastActiveAt || conversation.lastActiveAt || null,
          }
      );

      setConversations((prev) => prev.map(withPresence));
      const selected = selectedChatId ? findHeld(selectedChatId) : undefined;
      if (selected && String(selected.friendId) === String(payload.userId)) {
        onSelectChat(withPresence(selected), false);
      }
    };

    PRESENCE_SOCKET_EVENTS.forEach((eventName) => socket.on(eventName, handlePresenceChanged));
    return () => {
      PRESENCE_SOCKET_EVENTS.forEach((eventName) => socket.off(eventName, handlePresenceChanged));
    };
  }, [onSelectChat, selectedChatId]);

  const hideConversation = async (chat: Pick<Conversation, "id">) => {
    await hideChatConversation({ conversationId: chat.id });
    setConversations((prev) => prev.filter((item) => item.id !== chat.id));
    if (selectedChatId === chat.id) {
      const remaining = conversationsRef.current.filter((item) => item.id !== chat.id);
      onSelectChat(remaining[0] || null, false);
    }
  };

  const createGroup = async ({ name, avatar }: { name: string; avatar?: File | null }): Promise<Conversation> => {
    const data = await createGroupConversation({ name, avatar });
    const conversation = data?.conversation;
    if (!conversation?.id) throw new Error("Group conversation not available");

    setConversations((prev) => [conversation, ...prev.filter((item) => item.id !== conversation.id)]);
    onSelectChat(conversation);
    return conversation;
  };

  return {
    conversations,
    isLoading,
    error,
    hideConversation,
    createGroup,
  };
}
