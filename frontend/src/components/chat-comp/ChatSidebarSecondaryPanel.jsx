import { MOCK_GROUP_CHATS, MOCK_RECENT_CHATS } from "../../lib/chatSidebarData.js";

function SecondaryHeader({ title, subtitle }) {
  return (
    <div className="border-b border-[#e4e6eb] px-4 py-3">
      <h2 className="text-lg font-bold text-[#1c1e21]">{title}</h2>
      {subtitle ? <p className="mt-0.5 text-xs text-[#65676b]">{subtitle}</p> : null}
    </div>
  );
}

function RowChat({ chat, isActive, onSelectChat }) {
  return (
    <button
      type="button"
      onClick={() => onSelectChat(chat)}
      className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
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
          <span className="shrink-0 text-xs font-normal text-[#8a8d91]">{chat.time}</span>
        </div>
        <p className="truncate text-xs font-normal text-[#65676b]">{chat.preview}</p>
      </div>
      {chat.unread > 0 && (
        <span className="mt-0.5 flex h-5 min-w-5 shrink-0 items-center justify-center self-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
          {chat.unread}
        </span>
      )}
    </button>
  );
}

export default function ChatSidebarSecondaryPanel({ selectedChatId, onSelectChat }) {
  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-r border-[#e4e6eb] bg-white overflow-hidden">
      <SecondaryHeader title="Messages" subtitle="Conversations" />
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div className="space-y-0.5">
          <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-[#8a8d91]">
            Recent
          </p>
          {MOCK_RECENT_CHATS.map((chat) => (
            <RowChat
              key={chat.id}
              chat={chat}
              isActive={selectedChatId === chat.id}
              onSelectChat={onSelectChat}
            />
          ))}
        </div>
        <div className="space-y-0.5">
          <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-[#8a8d91]">
            Groups
          </p>
          {MOCK_GROUP_CHATS.map((chat) => (
            <RowChat
              key={chat.id}
              chat={chat}
              isActive={selectedChatId === chat.id}
              onSelectChat={onSelectChat}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
