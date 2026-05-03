import { useEffect, useState } from "react";
import ChatHeader from "./ChatHeader.jsx";
import MessageList from "./MessageList.jsx";
import MessageInput from "./MessageInput.jsx";
import {
  deleteChatMessage,
  getChatMessages,
  markChatConversationRead,
  sendChatImage,
  sendChatMessage,
} from "../../lib/api.js";
import { getAuthenticatedSocket } from "../../lib/socket.js";

function appendMessageOnce(messages, nextMessage) {
  if (!nextMessage?._id) return messages;
  if (messages.some((message) => message._id === nextMessage._id)) return messages;
  return [...messages, nextMessage];
}

export default function ChatSectionView({ selectedChatThread, onOpenProfile, user }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [olderCursor, setOlderCursor] = useState(null);
  const [error, setError] = useState("");

  const selectedChat = selectedChatThread || null;
  const activeThreadId = selectedChat?.id;

  useEffect(() => {
    let isMounted = true;

    async function loadMessages() {
      if (!activeThreadId) {
        setMessages([]);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const data = await getChatMessages({ conversationId: activeThreadId });
        if (isMounted) {
          setMessages(data?.messages || []);
          setHasOlderMessages(Boolean(data?.pageInfo?.hasMore));
          setOlderCursor(data?.pageInfo?.nextBefore || null);
        }
      } catch (err) {
        if (isMounted) setError(err.message || "Failed to load messages");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadMessages();

    return () => {
      isMounted = false;
    };
  }, [activeThreadId]);

  const handleLoadOlderMessages = async () => {
    if (!activeThreadId || !olderCursor || isLoadingOlder) return;

    setIsLoadingOlder(true);

    try {
      const data = await getChatMessages({
        conversationId: activeThreadId,
        before: olderCursor,
      });
      const olderMessages = data?.messages || [];

      setMessages((prevMessages) => {
        const existingIds = new Set(prevMessages.map((message) => message._id));
        return [
          ...olderMessages.filter((message) => !existingIds.has(message._id)),
          ...prevMessages,
        ];
      });
      setHasOlderMessages(Boolean(data?.pageInfo?.hasMore));
      setOlderCursor(data?.pageInfo?.nextBefore || null);
    } catch (err) {
      setError(err.message || "Failed to load older messages");
    } finally {
      setIsLoadingOlder(false);
    }
  };

  useEffect(() => {
    if (!activeThreadId) return undefined;

    const socket = getAuthenticatedSocket();
    if (!socket) return undefined;

    const handleMessageCreated = (payload) => {
      if (payload?.conversationId !== activeThreadId || !payload?.message) return;

      setMessages((prevMessages) => {
        return appendMessageOnce(prevMessages, payload.message);
      });

      if (payload.message.senderId !== user?.id) {
        markChatConversationRead({ conversationId: activeThreadId }).catch(() => {});
      }
    };

    const handleMessageDeleted = (payload) => {
      if (payload?.conversationId !== activeThreadId || !payload?.message) return;

      setMessages((prevMessages) => prevMessages.map((message) => (
        message._id === payload.message._id ? payload.message : message
      )));
    };

    socket.on("chat:message_created", handleMessageCreated);
    socket.on("chat:message_deleted", handleMessageDeleted);

    return () => {
      socket.off("chat:message_created", handleMessageCreated);
      socket.off("chat:message_deleted", handleMessageDeleted);
    };
  }, [activeThreadId, user?.id]);

  const handleSendMessage = async (text) => {
    if (!activeThreadId) return;

    const data = await sendChatMessage({ conversationId: activeThreadId, text });
    if (data?.message) {
      setMessages((prevMessages) => appendMessageOnce(prevMessages, data.message));
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!activeThreadId) return;

    await deleteChatMessage({ messageId });
    setMessages((prevMessages) => prevMessages.map((message) => (
      message._id === messageId
        ? { ...message, text: "", imageUrl: "", isDeleted: true }
        : message
    )));
  };

  const handleAttachImage = async (file) => {
    if (!activeThreadId) return;

    const data = await sendChatImage({
      conversationId: activeThreadId,
      file,
    });
    if (data?.message) {
      setMessages((prevMessages) => appendMessageOnce(prevMessages, data.message));
    }
  };

  const handleCall = () => {
    alert(`Calling ${selectedChat.name}...`);
  };

  const handleOpenChatProfile = () => {
    if (selectedChat.type === "group") return;

    onOpenProfile?.({
      id: selectedChat.friendId,
      displayName: selectedChat.name,
      avatarUrl: selectedChat.profilePic,
      bio: "No bio yet",
    });
  };

  if (!selectedChat) {
    return (
      <div className="mx-auto w-full max-w-[900px] px-4 py-6">
        <div className="rounded-lg border border-[#e4e6eb] bg-white px-8 py-16 text-center shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)]">
          <p className="text-base font-semibold text-[#1c1e21]">No conversation selected yet</p>
          <p className="mt-1 text-sm text-[#65676b]">
            Choose a conversation from the sidebar to open it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto h-[calc(113vh-160px)] w-full max-w-[1200px] border border-[#e4e6eb] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)]">
      <div className="flex h-full flex-col">
        <ChatHeader
          chat={selectedChat}
          onCall={handleCall}
          onOpenProfile={handleOpenChatProfile}
          canOpenProfile={selectedChat.type !== "group"}
        />
        <MessageList
          messages={messages}
          currentUserId={user?.id}
          isGroupChat={selectedChat.type === "group"}
          onDeleteMessage={handleDeleteMessage}
          isLoading={isLoading}
          error={error}
          hasOlderMessages={hasOlderMessages}
          isLoadingOlder={isLoadingOlder}
          onLoadOlderMessages={handleLoadOlderMessages}
        />
        <MessageInput onSend={handleSendMessage} onAttachImage={handleAttachImage} />
      </div>
    </section>
  );
}
