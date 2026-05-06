function getPresenceMeta(status) {
  if (status === "online") {
    return {
      label: "Online",
      dotClassName: "bg-emerald-500",
    };
  }
  if (status === "away") {
    return {
      label: "Away",
      dotClassName: "bg-amber-400",
    };
  }

  return {
    label: "Offline",
    dotClassName: "bg-[#bcc0c4]",
  };
}

export default function ChatHeader({ chat, onCall, onOpenProfile, canOpenProfile = true }) {
  const presence = getPresenceMeta(chat.presenceStatus);

  return (
    <header className="flex items-center justify-between border-b border-[#e4e6eb] px-4 py-3">
      <div className="flex items-center gap-3">
        {canOpenProfile ? (
          <button
            type="button"
            onClick={onOpenProfile}
            className="rounded-full focus:outline-none"
            aria-label={`Open ${chat.name} profile`}
          >
            <span className="relative block h-10 w-10">
              <img src={chat.profilePic} alt={chat.name} className="h-10 w-10 rounded-full object-cover" />
              <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${presence.dotClassName}`} />
            </span>
          </button>
        ) : (
          <span className="relative block h-10 w-10">
            <img src={chat.profilePic} alt={chat.name} className="h-10 w-10 rounded-full object-cover" />
            {chat.type !== "group" && (
              <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${presence.dotClassName}`} />
            )}
          </span>
        )}
        <div>
          {canOpenProfile ? (
            <button
              type="button"
              onClick={onOpenProfile}
              className="font-semibold text-[#1c1e21] hover:underline"
            >
              {chat.name}
            </button>
          ) : (
            <p className="font-semibold text-[#1c1e21]">{chat.name}</p>
          )}
          <p className="text-xs text-[#65676b]">
            <span>{chat.type === "group" ? "Group chat" : presence.label}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onCall?.voice ? (
          <button
            type="button"
            onClick={onCall.voice}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#1c1e21] transition hover:bg-[#f0f2f5]"
            aria-label="Voice call"
          >
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
            </svg>
          </button>
        ) : null}
        {onCall?.video ? (
          <button
            type="button"
            onClick={onCall.video}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#1c1e21] transition hover:bg-[#f0f2f5]"
            aria-label="Video call"
          >
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </button>
        ) : null}
      </div>
    </header>
  );
}
