import type { OutgoingMessageStatus, User } from "../../types";

interface MessageStatusProps {
  status: OutgoingMessageStatus;
  isGroupChat: boolean;
  /** Other members who have read the message (groups show who, while not everyone has). */
  readers: Pick<User, "id" | "displayName">[];
  /** Only for `failed`. */
  onRetry?: () => void;
  onDiscard?: () => void;
}

const MAX_NAMED_READERS = 3;

function Tick({ double = false, className = "" }: { double?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 18 12" className={`h-3 w-[18px] ${className}`} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M1 6.5 4.5 10 11 2" strokeLinecap="round" strokeLinejoin="round" />
      {double && <path d="M7.5 9.2 8.5 10 15 2" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <circle cx="6" cy="6" r="4.8" />
      <path d="M6 3.4V6l1.8 1.2" strokeLinecap="round" />
    </svg>
  );
}

function formatReaders(readers: MessageStatusProps["readers"]): string {
  const names = readers.slice(0, MAX_NAMED_READERS).map((reader) => reader.displayName || "Someone");
  const rest = readers.length - names.length;
  return rest > 0 ? `${names.join(", ")} +${rest}` : names.join(", ");
}

/** Sending → Sent (✓) → Delivered (✓✓) → Seen (blue ✓✓), under one of my messages. */
export default function MessageStatus({ status, isGroupChat, readers, onRetry, onDiscard }: MessageStatusProps) {
  if (status === "failed") {
    return (
      <div role="alert" className="flex items-center justify-end gap-1.5 pr-1 text-[11px] font-medium text-red-500" data-status="failed">
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor" aria-hidden="true">
          <path d="M6 0a6 6 0 1 1 0 12A6 6 0 0 1 6 0Zm0 2.6a.8.8 0 0 0-.8.8v3a.8.8 0 0 0 1.6 0v-3a.8.8 0 0 0-.8-.8Zm0 5.4a.85.85 0 1 0 0 1.7.85.85 0 0 0 0-1.7Z" />
        </svg>
        <span>Not sent.</span>
        <button type="button" onClick={onRetry} className="font-semibold text-[#0866ff] hover:underline">
          Retry
        </button>
        <span aria-hidden="true">·</span>
        <button type="button" onClick={onDiscard} className="font-semibold text-[#65676b] hover:underline">
          Delete
        </button>
      </div>
    );
  }

  let icon = <Tick />;
  let label = "Sent";
  let colorClass = "text-[#65676b]";

  if (status === "sending") {
    icon = <ClockIcon />;
    label = "Sending…";
  } else if (status === "delivered") {
    icon = <Tick double />;
    label = "Delivered";
  } else if (status === "read") {
    icon = <Tick double />;
    label = isGroupChat ? "Seen by everyone" : "Seen";
    colorClass = "text-[#0866ff]";
  }

  const partialReaders = isGroupChat && status !== "read" && readers.length > 0
    ? `Seen by ${formatReaders(readers)}`
    : "";

  return (
    <div
      className={`flex items-center justify-end gap-1 pr-1 text-[11px] font-medium ${colorClass}`}
      data-status={status}
    >
      {icon}
      <span>{label}</span>
      {partialReaders && (
        <span className="text-[#65676b]" title={readers.map((reader) => reader.displayName).join(", ")}>
          · {partialReaders}
        </span>
      )}
    </div>
  );
}
