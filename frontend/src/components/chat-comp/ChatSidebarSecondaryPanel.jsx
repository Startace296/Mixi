import { useEffect, useRef, useState } from "react";
import { createGroupConversation, getChatConversations, hideChatConversation } from "../../lib/api.js";
import { CHAT_SOCKET_EVENTS, PRESENCE_SOCKET_EVENTS, getAuthenticatedSocket } from "../../lib/socket.js";
import { formatMessengerTime } from "../../lib/timeFormat.js";
import { getAvatarUrl } from "../../lib/avatarUrl.js";

function CreateGroupModal({ onClose, onCreate }) {
  const [groupName, setGroupName] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview, onClose]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleCreate = () => {
    const name = groupName.trim();
    if (!name) return;
    onCreate({ name, avatar: avatarFile });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0f2f5] px-6 py-4">
          <h2 className="text-base font-bold text-[#1c1e21]">New Group Chat</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#65676b] transition hover:bg-[#f0f2f5]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <img
                src={avatarPreview || "/basic_group_chat_avatar.png"}
                alt="Group avatar"
                className="h-20 w-20 rounded-full object-cover ring-2 ring-[#e4e6eb]"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md transition hover:bg-indigo-700"
                aria-label="Upload group photo"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <p className="text-[11px] text-[#8a8d91]">Group photo (optional)</p>
          </div>

          {/* Group name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-[#65676b]">
              Group name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              placeholder="Group name..."
              maxLength={80}
              autoFocus
              className="rounded-lg border border-[#dddfe2] px-4 py-2.5 text-sm text-[#1c1e21] outline-none transition-colors focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-[#f0f2f5] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#e4e6eb] py-2 text-sm font-semibold text-[#65676b] transition hover:bg-[#f0f2f5]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!groupName.trim()}
            className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

function formatPreview(chat, currentUserId) {
  const previewText = (chat.preview || "").trim();
  if (!previewText || previewText === "No messages yet") {
    return "No messages yet.";
  }
  if (previewText === "This message was deleted") {
    return previewText;
  }
  if (chat.lastMessageSenderId && currentUserId && String(chat.lastMessageSenderId) === String(currentUserId)) {
    return `You: ${previewText}`;
  }
  return previewText;
}

function RowChat({ chat, currentUserId, isActive, onSelectChat, onDeleteChat }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const timeLabel = formatMessengerTime(chat.time);
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => onSelectChat(chat)}
        className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 pr-9 text-left text-sm font-semibold transition-colors ${isActive ? "bg-indigo-50 text-indigo-600" : "text-[#1c1e21] hover:bg-[#f0f2f5]"
          }`}
      >
        <span className="relative h-10 w-10 shrink-0">
          <img
            src={getAvatarUrl(chat.profilePic, chat.type)}
            alt={chat.name}
            className="h-10 w-10 rounded-full object-cover ring-1 ring-black/5"
          />
          {chat.type !== "group" && (
            <span
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${getPresenceDotClassName(chat.presenceStatus)}`}
              title={chat.presenceStatus || "offline"}
            />
          )}
        </span>
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

function getConversationSortTime(conversation) {
  return new Date(conversation?.time || conversation?.lastMessageAt || conversation?.updatedAt || 0).getTime();
}

function getPresenceDotClassName(status) {
  if (status === "online") return "bg-emerald-500";
  if (status === "away") return "bg-amber-400";
  return "bg-[#bcc0c4]";
}

export default function ChatSidebarSecondaryPanel({ selectedChatId, onSelectChat, currentUserId, onCreateGroup }) {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
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

    const applyConversationUpdate = (conversation) => {
      if (!conversation?.id) return false;

      setConversations((prevConversations) => {
        const existingIndex = prevConversations.findIndex((item) => item.id === conversation.id);
        if (existingIndex === -1) return [conversation, ...prevConversations];

        const nextConversations = [...prevConversations];
        nextConversations[existingIndex] = {
          ...nextConversations[existingIndex],
          ...conversation,
        };
        return nextConversations.sort((left, right) => getConversationSortTime(right) - getConversationSortTime(left));
      });

      if (selectedChatId === conversation.id) {
        onSelectChat(conversation, false);
      }

      return true;
    };

    const refreshConversations = async () => {
      try {
        const data = await getChatConversations();
        setConversations(data?.conversations || []);
      } catch {
        // Keep the existing sidebar state during transient socket refresh failures.
      }
    };

    const handleChatEvent = (payload) => {
      if (!applyConversationUpdate(payload?.conversation)) {
        refreshConversations();
      }
    };

    const handleConversationRemoved = (payload) => {
      if (!payload?.conversationId) return;

      setConversations((prevConversations) => {
        const nextConversations = prevConversations.filter((conversation) => conversation.id !== payload.conversationId);
        if (selectedChatId === payload.conversationId) {
          onSelectChat(nextConversations[0] || null, true);
        }
        return nextConversations;
      });
    };

    CHAT_SOCKET_EVENTS.forEach((eventName) => {
      socket.on(eventName, handleChatEvent);
    });
    socket.on("chat:conversation_removed", handleConversationRemoved);

    return () => {
      CHAT_SOCKET_EVENTS.forEach((eventName) => {
        socket.off(eventName, handleChatEvent);
      });
      socket.off("chat:conversation_removed", handleConversationRemoved);
    };
  }, [onSelectChat, selectedChatId]);

  useEffect(() => {
    if (!selectedChatId) return;

    setConversations((prevConversations) => (
      prevConversations.map((conversation) => (
        conversation.id === selectedChatId
          ? { ...conversation, unread: 0 }
          : conversation
      ))
    ));
  }, [selectedChatId]);

  useEffect(() => {
    const socket = getAuthenticatedSocket();
    if (!socket) return undefined;

    const handlePresenceChanged = (payload) => {
      if (!payload?.userId) return;

      setConversations((prevConversations) => (
        prevConversations.map((conversation) => {
          if (String(conversation.friendId) !== String(payload.userId)) return conversation;

          const nextConversation = {
            ...conversation,
            presenceStatus: payload.status || "offline",
            lastActiveAt: payload.lastActiveAt || conversation.lastActiveAt || null,
          };

          if (selectedChatId === conversation.id) {
            onSelectChat(nextConversation, false);
          }

          return nextConversation;
        })
      ));
    };

    PRESENCE_SOCKET_EVENTS.forEach((eventName) => {
      socket.on(eventName, handlePresenceChanged);
    });

    return () => {
      PRESENCE_SOCKET_EVENTS.forEach((eventName) => {
        socket.off(eventName, handlePresenceChanged);
      });
    };
  }, [onSelectChat, selectedChatId]);

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
    <>
      <aside className="flex h-full w-[300px] shrink-0 flex-col border-r border-[#e4e6eb] bg-white overflow-hidden">
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div className="space-y-0.5">
            <div className="flex items-center justify-between px-3 pt-2 pb-1">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#8a8d91]">Recent</p>
              <button
                type="button"
                id="btn-create-group-chat"
                onClick={() => setCreateGroupOpen(true)}
                aria-label="Create group chat"
                title="Create group chat"
                className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700 active:scale-95"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
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

      {createGroupOpen && (
        <CreateGroupModal
          onClose={() => setCreateGroupOpen(false)}
          onCreate={async ({ name, avatar }) => {
            if (isCreatingGroup) return;
            setIsCreatingGroup(true);
            try {
              const data = await createGroupConversation({ name, avatar });
              const conversation = data?.conversation;
              if (!conversation?.id) throw new Error("Group conversation not available");

              setConversations((prev) => [conversation, ...prev.filter((item) => item.id !== conversation.id)]);
              setCreateGroupOpen(false);
              onSelectChat(conversation);
              onCreateGroup?.(conversation);
            } catch (err) {
              window.alert(err.message || "Failed to create group chat");
            } finally {
              setIsCreatingGroup(false);
            }
          }}
        />
      )}
    </>
  );
}
