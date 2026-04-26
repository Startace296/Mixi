import { useState } from "react";
import ChatHeader from "./ChatHeader.jsx";
import MessageList from "./MessageList.jsx";
import MessageInput from "./MessageInput.jsx";
import { MOCK_CHAT_THREADS } from "../../lib/chatSidebarData.js";

const DEFAULT_CHAT_THREAD = MOCK_CHAT_THREADS[0] || null;

const INITIAL_MESSAGES_BY_THREAD = {
  "1": [
    {
      _id: "m_1",
      senderId: "1",
      text: "Hey, are we still meeting this afternoon?",
      createdAt: "2026-04-26T02:10:00.000Z",
    },
    {
      _id: "m_2",
      senderId: "me",
      text: "Yes, see you at 2 PM.",
      createdAt: "2026-04-26T02:12:00.000Z",
    },
  ],
  "3": [
    {
      _id: "m_3",
      senderId: "3",
      text: "I uploaded the latest design file.",
      createdAt: "2026-04-25T09:00:00.000Z",
    },
  ],
  "4": [
    {
      _id: "m_4",
      senderId: "4",
      text: "The merge is done, please pull main.",
      createdAt: "2026-04-24T08:40:00.000Z",
    },
  ],
  g1: [
    {
      _id: "m_5",
      senderId: "u_teacher",
      senderName: "Teacher",
      senderAvatar: "https://i.pravatar.cc/100?img=45",
      text: "Deadline next week, please prepare your slides.",
      createdAt: "2026-04-23T06:10:00.000Z",
    },
    {
      _id: "m_6",
      senderId: "u_huy",
      senderName: "Huy",
      senderAvatar: "https://i.pravatar.cc/100?img=62",
      text: "I can present the API flow.",
      createdAt: "2026-04-23T06:18:00.000Z",
    },
    {
      _id: "m_7",
      senderId: "me",
      text: "Great, I will handle the frontend demo.",
      createdAt: "2026-04-23T06:23:00.000Z",
    },
  ],
};

export default function ChatSectionView({ selectedChatThread }) {
  const [messagesByThread, setMessagesByThread] = useState(INITIAL_MESSAGES_BY_THREAD);

  const selectedChat = selectedChatThread || DEFAULT_CHAT_THREAD;
  const activeThreadId = selectedChat?.id;
  const messages = activeThreadId ? messagesByThread[activeThreadId] || [] : [];

  const handleSendMessage = (text) => {
    if (!activeThreadId) return;

    const newMessage = {
      _id: `m_${Date.now()}`,
      senderId: "me",
      text,
      createdAt: new Date().toISOString(),
    };

    setMessagesByThread((prevMessagesByThread) => ({
      ...prevMessagesByThread,
      [activeThreadId]: [...(prevMessagesByThread[activeThreadId] || []), newMessage],
    }));
  };

  const handleDeleteMessage = (messageId) => {
    if (!activeThreadId) return;

    setMessagesByThread((prevMessagesByThread) => ({
      ...prevMessagesByThread,
      [activeThreadId]: (prevMessagesByThread[activeThreadId] || []).filter(
        (message) => message._id !== messageId
      ),
    }));
  };

  const handleAttachImage = (file) => {
    if (!activeThreadId) return;

    const newMessage = {
      _id: `m_${Date.now()}`,
      senderId: "me",
      text: `Attached image: ${file.name}`,
      createdAt: new Date().toISOString(),
    };

    setMessagesByThread((prevMessagesByThread) => ({
      ...prevMessagesByThread,
      [activeThreadId]: [...(prevMessagesByThread[activeThreadId] || []), newMessage],
    }));
  };

  const handleCall = () => {
    alert(`Calling ${selectedChat.name}...`);
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
        <ChatHeader chat={selectedChat} onCall={handleCall} />
        <MessageList
          messages={messages}
          currentUserId="me"
          isGroupChat={selectedChat.type === "group"}
          onDeleteMessage={handleDeleteMessage}
        />
        <MessageInput onSend={handleSendMessage} onAttachImage={handleAttachImage} />
      </div>
    </section>
  );
}
