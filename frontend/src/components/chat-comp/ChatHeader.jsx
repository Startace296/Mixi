function getPresenceMeta(status) {
  if (status === "online") return { label: "Online", dotClassName: "bg-emerald-500" };
  if (status === "away") return { label: "Away", dotClassName: "bg-amber-400" };
  return { label: "Offline", dotClassName: "bg-[#bcc0c4]" };
}

export default function ChatHeader({ chat, onCall, onOpenProfile, canOpenProfile = true }) {
  const presence = getPresenceMeta(chat.presenceStatus);

  const renderCallBtn = (onClick, label, children) => (
    <div className="group relative">
      <button
        type="button"
        id={`call-btn-${label.toLowerCase().replace(/\s/g, "-")}`}
        onClick={onClick}
        aria-label={label}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[#65676b] transition hover:bg-violet-50 hover:text-violet-600 active:scale-95"
      >
        {children}
      </button>
      <span
        className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: "rgba(28,30,33,0.85)", zIndex: 10 }}
      >
        {label}
      </span>
    </div>
  );

  return (
    <header className="flex items-center justify-between border-b border-[#e4e6eb] bg-white px-4 py-3">
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
            {chat.type === "group" ? "Group chat" : presence.label}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {onCall?.voice && renderCallBtn(onCall.voice, "Voice call", (
          <svg
            className="h-[18px] w-[18px]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        ))}
        {onCall?.video && renderCallBtn(onCall.video, "Video call", (
          <svg
            className="h-[18px] w-[18px]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        ))}
      </div>
    </header>
  );
}
