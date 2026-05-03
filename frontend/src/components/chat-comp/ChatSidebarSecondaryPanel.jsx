import { useEffect, useRef, useState } from "react";
import { getChatConversations, hideChatConversation } from "../../lib/api.js";
import { CHAT_SOCKET_EVENTS, getAuthenticatedSocket } from "../../lib/socket.js";

function formatPreview(chat, currentUserId) {
  const previewText = (chat.preview || "").trim();
  if (!previewText || previewText === "No messages yet") {
    return "No messages yet.";
  }
  if (chat.lastMessageSenderId && currentUserId && String(chat.lastMessageSenderId) === String(currentUserId)) {
    return `You: ${previewText}`;
  }
  return previewText;
}

function RowChat({ chat, currentUserId, isActive, onSelectChat, onDeleteChat }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const timeLabel = chat.time
    ? new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(chat.time))
    : "";
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => onSelectChat(chat)}
        className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 pr-9 text-left text-sm font-semibold transition-colors ${
          isActive ? "bg-indigo-50 text-indigo-600" : "text-[#1c1e21] hover:bg-[#f0f2f5]"
        }`}
      >
        <img
          src={chat.profilePic}
          alt={chat.name}
          className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-black/5"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate">{chat.name}</span>
            <span className="shrink-0 text-xs font-normal text-[#8a8d91]">{timeLabel}</span>
          </div>
          <p className="truncate text-xs font-normal text-[#65676b]">{formatPreview(chat, currentUserId)}</p>
        </div>
        {chat.unread > 0 && (
          <span className="mt-0.5 flex h-5 min-w-5 shrink-0 items-center justify-center self-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
            {chat.unread}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setMenuOpen((prev) => !prev);
        }}
        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#65676b] opacity-0 transition hover:bg-white group-hover:opacity-100"
        aria-label="Open conversation actions"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 10a2 2 0 114 0 2 2 0 01-4 0zm5 0a2 2 0 114 0 2 2 0 01-4 0zm5 0a2 2 0 114 0 2 2 0 01-4 0z" />
        </svg>
      </button>
      {menuOpen && (
        <div className="absolute right-2 top-11 z-20 min-w-[130px] rounded-md border border-[#e4e6eb] bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen(false);
              onDeleteChat(chat);
            }}
            className="w-full px-3 py-2 text-left text-sm text-red-500 transition hover:bg-red-50"
          >
            Delete chat
          </button>
        </div>
      )}
    </div>
  );
}

export default function ChatSidebarSecondaryPanel({ selectedChatId, onSelectChat, currentUserId }) {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function loadConversations({ silent = false } = {}) {
      if (!hasLoadedOnceRef.current) {
        setIsLoading(true);
      }
      if (!silent) {
        setError("");
      }

      try {
        const data = await getChatConversations();
        const nextConversations = data?.conversations || [];

        if (!isMounted) return;
        setConversations(nextConversations);
        hasLoadedOnceRef.current = true;

        if (selectedChatId) {
          const matchedConversation = nextConversations.find((conversation) => conversation.id === selectedChatId);
          if (matchedConversation) {
            onSelectChat(matchedConversation, false);
          }
        } else if (nextConversations.length > 0) {
          onSelectChat(nextConversations[0], false);
        }
      } catch (err) {
        if (isMounted && !silent) setError(err.message || "Failed to load conversations");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadConversations();

    return () => {
      isMounted = false;
    };
  }, [onSelectChat]);

  useEffect(() => {
    const socket = getAuthenticatedSocket();
    if (!socket) return undefined;

    const refreshConversations = async () => {
      try {
        const data = await getChatConversations();
        setConversations(data?.conversations || []);
      } catch {
        // Keep the existing sidebar state during transient socket refresh failures.
      }
    };

    CHAT_SOCKET_EVENTS.forEach((eventName) => {
      socket.on(eventName, refreshConversations);
    });

    return () => {
      CHAT_SOCKET_EVENTS.forEach((eventName) => {
        socket.off(eventName, refreshConversations);
      });
    };
  }, []);

  const handleDeleteChat = async (chat) => {
    const confirmed = window.confirm("Delete this chat from your inbox?");
    if (!confirmed) return;

    await hideChatConversation({ conversationId: chat.id });
    setConversations((prevConversations) => {
      const nextConversations = prevConversations.filter((conversation) => conversation.id !== chat.id);
      if (selectedChatId === chat.id) {
        onSelectChat(nextConversations[0] || null, false);
      }
      return nextConversations;
    });
  };

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-r border-[#e4e6eb] bg-white overflow-hidden">
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div className="space-y-0.5">
          <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-[#8a8d91]">
            Recent
          </p>
          {isLoading && (
            <p className="px-3 py-2 text-sm font-normal text-[#65676b]">Loading conversations...</p>
          )}
          {!isLoading && error && (
            <p className="px-3 py-2 text-sm font-normal text-red-500">{error}</p>
          )}
          {!isLoading && !error && conversations.length === 0 && (
            <p className="px-3 py-2 text-sm font-normal text-[#65676b]">No conversations yet.</p>
          )}
          {!isLoading && !error && conversations.map((chat) => (
            <RowChat
              key={chat.id}
              chat={chat}
              currentUserId={currentUserId}
              isActive={selectedChatId === chat.id}
              onSelectChat={onSelectChat}
              onDeleteChat={handleDeleteChat}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
