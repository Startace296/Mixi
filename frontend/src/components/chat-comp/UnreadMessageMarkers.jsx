export function UnreadCountBanner({ count }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="h-px flex-1 bg-blue-200" />
      <span className="shrink-0 rounded-full bg-blue-50 px-3 py-0.5 text-[11px] font-semibold text-blue-600">
        There are {count} unread messages
      </span>
      <div className="h-px flex-1 bg-blue-200" />
    </div>
  );
}

export function SummarizeUnreadButton({ onClick }) {
  return (
    <div className="flex items-center gap-2 py-2">
      <div className="h-px flex-1 bg-blue-200" />
      <button
        type="button"
        className="shrink-0 rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-600 transition hover:bg-blue-100 active:scale-95"
        onClick={onClick}
      >
        Summarize unread messages
      </button>
      <div className="h-px flex-1 bg-blue-200" />
    </div>
  );
}
