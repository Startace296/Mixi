import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { suggestChatReplies, summarizeUnreadChat } from "../lib/api.js";

function buildCacheKey(conversationId, markers) {
  if (!conversationId || !markers?.lastId) return null;
  return `${conversationId}:${markers.lastId}:${markers.count ?? 0}`;
}

export function useUnreadSummarize({ conversationId, onApplySuggestedReply }) {
  const markersRef = useRef(null);
  const cacheRef = useRef({
    summaryKey: null,
    summaryBullets: [],
    suggestionsKey: null,
    suggestions: [],
  });

  const [unreadUiDismissed, setUnreadUiDismissed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryBullets, setSummaryBullets] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    markersRef.current = null;
    cacheRef.current = {
      summaryKey: null,
      summaryBullets: [],
      suggestionsKey: null,
      suggestions: [],
    };
    setUnreadUiDismissed(false);
    setIsOpen(false);
    setIsLoadingSummary(false);
    setSummaryBullets([]);
    setSuggestions([]);
    setShowSuggestions(false);
    setIsLoadingSuggestions(false);
  }, [conversationId]);

  const close = () => {
    setIsOpen(false);
    setShowSuggestions(false);
    setIsLoadingSuggestions(false);
  };

  const open = async (markers) => {
    if (!conversationId || !markers?.lastId) return;

    const cacheKey = buildCacheKey(conversationId, markers);
    markersRef.current = markers;
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
      const data = await summarizeUnreadChat({
        conversationId,
        endMessageId: markers.lastId,
        maxMessages: Math.min(markers.count || 30, 50),
      });
      const bullets = data.summaryBullets || [];
      cacheRef.current.summaryKey = cacheKey;
      cacheRef.current.summaryBullets = bullets;
      setSummaryBullets(bullets);
    } catch (error) {
      toast.error(error.message || "Failed to summarize messages");
      close();
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const suggestResponses = async () => {
    const markers = markersRef.current;
    if (!conversationId || !markers?.lastId) return;

    const cacheKey = buildCacheKey(conversationId, markers);
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
      const data = await suggestChatReplies({
        conversationId,
        endMessageId: markers.lastId,
        maxMessages: Math.min(markers.count || 30, 50),
      });
      const replies = data.replies || [];
      cacheRef.current.suggestionsKey = cacheKey;
      cacheRef.current.suggestions = replies;
      setSuggestions(replies);
    } catch (error) {
      toast.error(error.message || "Failed to generate suggestions");
      setShowSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const selectSuggestion = (reply) => {
    onApplySuggestedReply?.(reply);
    setUnreadUiDismissed(true);
    close();
  };

  return {
    unreadUiDismissed,
    isOpen,
    isLoadingSummary,
    summaryBullets,
    suggestions,
    showSuggestions,
    isLoadingSuggestions,
    open,
    close,
    suggestResponses,
    selectSuggestion,
  };
}
