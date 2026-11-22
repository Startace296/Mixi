import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { suggestChatReplies, summarizeChat } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";
import type { Id, Message, UnreadMarkers } from "../../types";

interface SummarizeCache {
  summaryKey: string | null;
  summaryBullets: string[];
  suggestionsKey: string | null;
  suggestions: string[];
}

const EMPTY_CACHE: SummarizeCache = {
  summaryKey: null,
  summaryBullets: [],
  suggestionsKey: null,
  suggestions: [],
};

interface UseChatSummarizeOptions {
  conversationId: Id | null | undefined;
  onApplySuggestedReply?: (reply: string) => void;
  messages?: Pick<Message, "_id">[];
}

function buildCacheKey(conversationId: Id | null | undefined, markers: UnreadMarkers | null): string | null {
  if (!conversationId || !markers?.lastId) return null;
  return `${conversationId}:${markers.lastId}:${markers.count ?? 0}`;
}

function buildFromMessageCacheKey(conversationId: Id | null | undefined, startMessageId: Id | null): string | null {
  if (!conversationId || !startMessageId) return null;
  return `${conversationId}:from:${startMessageId}`;
}

export function useChatSummarize({ conversationId, onApplySuggestedReply, messages = [] }: UseChatSummarizeOptions) {
  const markersRef = useRef<UnreadMarkers | null>(null);
  const fromMessageIdRef = useRef<Id | null>(null); // startMessageId khi dùng "Summarize from here"
  const cacheRef = useRef<SummarizeCache>({ ...EMPTY_CACHE });

  const [unreadUiDismissed, setUnreadUiDismissed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryBullets, setSummaryBullets] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isFromMessageMode, setIsFromMessageMode] = useState(false); // phân biệt 2 mode

  useEffect(() => {
    markersRef.current = null;
    fromMessageIdRef.current = null;
    cacheRef.current = { ...EMPTY_CACHE };
    setUnreadUiDismissed(false);
    setIsOpen(false);
    setIsLoadingSummary(false);
    setSummaryBullets([]);
    setSuggestions([]);
    setShowSuggestions(false);
    setIsLoadingSuggestions(false);
    setIsFromMessageMode(false);
  }, [conversationId]);

  const close = () => {
    setIsOpen(false);
    setShowSuggestions(false);
    setIsLoadingSuggestions(false);
  };

  // Mode cũ: tóm tắt unread batch (giữ nguyên)
  const open = async (markers: UnreadMarkers | null | undefined) => {
    if (!conversationId || !markers?.lastId) return;

    const cacheKey = buildCacheKey(conversationId, markers);
    markersRef.current = markers;
    fromMessageIdRef.current = null;
    setIsFromMessageMode(false);
    setIsOpen(true);
    setShowSuggestions(false);
    setIsLoadingSuggestions(false);

    const cachedSummary = cacheRef.current.summaryKey === cacheKey
      ? cacheRef.current.summaryBullets
      : null;

    if (cachedSummary?.length) {
      setSummaryBullets(cachedSummary);
      setIsLoadingSummary(false);

      if (cacheRef.current.suggestionsKey === cacheKey) {
        setSuggestions(cacheRef.current.suggestions);
      } else {
        setSuggestions([]);
      }
      return;
    }

    setIsLoadingSummary(true);
    setSummaryBullets([]);
    setSuggestions([]);

    try {
      const data = await summarizeChat({
        conversationId,
        endMessageId: markers.lastId,
        maxMessages: Math.min(markers.count || 30, 50),
      });
      const bullets = data.summaryBullets || [];
      cacheRef.current.summaryKey = cacheKey;
      cacheRef.current.summaryBullets = bullets;
      setSummaryBullets(bullets);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to summarize messages"));
      close();
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Mode mới: tóm tắt từ tin được chọn đến tin cuối cùng hiện tại
  const openFromMessage = async (startMessageId: Id) => {
    if (!conversationId || !startMessageId) return;

    // endMessageId là tin nhắn cuối cùng trong danh sách hiện tại
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    const endMessageId = lastMessage._id;
    const cacheKey = buildFromMessageCacheKey(conversationId, startMessageId);

    fromMessageIdRef.current = startMessageId;
    markersRef.current = null;
    setIsFromMessageMode(true);
    setIsOpen(true);
    setShowSuggestions(false);
    setIsLoadingSuggestions(false);

    const cachedSummary = cacheRef.current.summaryKey === cacheKey
      ? cacheRef.current.summaryBullets
      : null;

    if (cachedSummary?.length) {
      setSummaryBullets(cachedSummary);
      setIsLoadingSummary(false);

      if (cacheRef.current.suggestionsKey === cacheKey) {
        setSuggestions(cacheRef.current.suggestions);
      } else {
        setSuggestions([]);
      }
      return;
    }

    setIsLoadingSummary(true);
    setSummaryBullets([]);
    setSuggestions([]);

    try {
      const data = await summarizeChat({
        conversationId,
        startMessageId,
        endMessageId,
      });
      const bullets = data.summaryBullets || [];
      cacheRef.current.summaryKey = cacheKey;
      cacheRef.current.summaryBullets = bullets;
      setSummaryBullets(bullets);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to summarize messages"));
      close();
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const suggestResponses = async () => {
    const markers = markersRef.current;
    const startMessageId = fromMessageIdRef.current;
    const lastMessage = messages[messages.length - 1];

    const cacheKey = isFromMessageMode
      ? buildFromMessageCacheKey(conversationId, startMessageId)
      : buildCacheKey(conversationId, markers);

    if (!conversationId || (!markers?.lastId && !startMessageId)) return;

    setShowSuggestions(true);

    const cachedSuggestions = cacheRef.current.suggestionsKey === cacheKey
      ? cacheRef.current.suggestions
      : null;

    if (cachedSuggestions?.length) {
      setSuggestions(cachedSuggestions);
      setIsLoadingSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    setSuggestions([]);

    try {
      const data = await suggestChatReplies(
        isFromMessageMode
          ? {
              conversationId,
              startMessageId: startMessageId ?? undefined,
              endMessageId: lastMessage?._id,
            }
          : {
              conversationId,
              endMessageId: markers?.lastId,
              maxMessages: Math.min(markers?.count || 30, 50),
            },
      );
      const replies = data.replies || [];
      cacheRef.current.suggestionsKey = cacheKey;
      cacheRef.current.suggestions = replies;
      setSuggestions(replies);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to generate suggestions"));
      setShowSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const selectSuggestion = (reply: string) => {
    onApplySuggestedReply?.(reply);
    setUnreadUiDismissed(true);
    close();
  };

  return {
    unreadUiDismissed,
    isOpen,
    isFromMessageMode,
    isLoadingSummary,
    summaryBullets,
    suggestions,
    showSuggestions,
    isLoadingSuggestions,
    open,
    openFromMessage,
    close,
    suggestResponses,
    selectSuggestion,
  };
}
