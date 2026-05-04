export default function ChatHeader({ chat, onCall, onOpenProfile, canOpenProfile = true }) {
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
            <img src={chat.profilePic} alt={chat.name} className="h-10 w-10 rounded-full object-cover" />
          </button>
        ) : (
          <img src={chat.profilePic} alt={chat.name} className="h-10 w-10 shrink-0 rounded-full object-cover" />
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
          <p className="text-xs text-[#65676b]">Active now</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCall}
          className="flex h-10 w-10 items-center justify-center rounded-full text-[#1c1e21] transition hover:bg-[#f0f2f5]"
          aria-label="Call"
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
            <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
          </svg>
        </button>
      </div>
    </header>
  );
}
