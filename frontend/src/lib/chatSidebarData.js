export const MOCK_RECENT_CHATS = [
  {
    id: "1",
    type: "direct",
    name: "Minh Anh",
    profilePic: "https://i.pravatar.cc/100?img=11",
    preview: "Okay, see you tomorrow!",
    time: "14:32",
    unread: 2,
  },
  {
    id: "3",
    type: "direct",
    name: "Lan Huong",
    profilePic: "https://i.pravatar.cc/100?img=16",
    preview: "You sent a photo",
    time: "Mon",
    unread: 0,
  },
  {
    id: "4",
    type: "direct",
    name: "Tuan Dev",
    profilePic: "https://i.pravatar.cc/100?img=28",
    preview: "Merge is done.",
    time: "Sun",
    unread: 1,
  },
];

export const MOCK_GROUP_CHATS = [
  {
    id: "g1",
    type: "group",
    name: "POSE 2026 Group",
    profilePic: "https://i.pravatar.cc/100?img=50",
    preview: "Teacher: Deadline next week...",
    time: "Yesterday",
    unread: 0,
  },
];

export const MOCK_CHAT_THREADS = [...MOCK_RECENT_CHATS, ...MOCK_GROUP_CHATS];

export function getDefaultChatThreadId() {
  return MOCK_CHAT_THREADS[0]?.id ?? '1';
}

export function getMockChatThreadById(threadId) {
  return MOCK_CHAT_THREADS.find((thread) => thread.id === threadId) || null;
}
