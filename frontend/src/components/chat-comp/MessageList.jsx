import { useEffect, useRef, useState } from "react";
import { formatFullMessageTime, formatMessengerTime } from "../../lib/timeFormat.js";

function getMessageDayKey(createdAt) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatCallDuration(totalSeconds = 0) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

function getCallMessageLabel(message, isMine) {
  const modeLabel = message.call?.mode === "video" ? "Video call" : "Voice call";
  const status = message.call?.status || "ended";

  if (status === "cancelled") return isMine ? "You cancelled the call" : "Call cancelled";
  if (status === "declined") return isMine ? "You declined the call" : "Call declined";
  if (status === "missed") return isMine ? "No answer" : "Missed call";

  const duration = formatCallDuration(message.call?.durationSeconds);
  return message.call?.durationSeconds ? `${modeLabel} · ${duration}` : modeLabel;
}

function CallMessageBubble({ message, isMine }) {
  const status = message.call?.status || "ended";
  const isFailedCall = ["cancelled", "declined", "missed"].includes(status);

  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isFailedCall
            ? isMine ? "bg-white/20 text-white" : "bg-red-100 text-red-500"
            : isMine ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-600"
        }`}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.06 2.18 2 2 0 0 1 4.05 0h3a2 2 0 0 1 2 1.72c.13.95.35 1.88.66 2.76a2 2 0 0 1-.45 2.11L8 7.85a16 16 0 0 0 6 6l1.26-1.26a2 2 0 0 1 2.11-.45c.88.31 1.81.53 2.76.66A2 2 0 0 1 22 14.8v2.12z" transform="translate(0 1)" />
        </svg>
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{getCallMessageLabel(message, isMine)}</p>
        <p className={`text-[11px] ${isMine ? "text-white/75" : "text-[#65676b]"}`}>
          {message.call?.mode === "video" ? "Video" : "Audio"}
        </p>
      </div>
    </div>
  );
}

export default function MessageList({
  messages,
  currentUserId,
  isGroupChat,
  onDeleteMessage,
  isLoading = false,
  hasOlderMessages = false,
  isLoadingOlder = false,
  onLoadOlderMessages,
  error = "",
}) {
  const listRef = useRef(null);
  const olderScrollPositionRef = useRef(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const lastMessageId = messages[messages.length - 1]?._id || "";

  useEffect(() => {
    if (!listRef.current) return;
    if (olderScrollPositionRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [lastMessageId]);

  useEffect(() => {
    const listElement = listRef.current;
    const previousPosition = olderScrollPositionRef.current;
    if (!listElement || !previousPosition || isLoadingOlder) return;

    listElement.scrollTop =
      listElement.scrollHeight - previousPosition.scrollHeight + previousPosition.scrollTop;
    olderScrollPositionRef.current = null;
  }, [isLoadingOlder, messages.length]);

  useEffect(() => {
    const handleWindowClick = () => {
      setOpenMenuId(null);
    };

    window.addEventListener("click", handleWindowClick);
    return () => {
      window.removeEventListener("click", handleWindowClick);
    };
  }, []);

  const handleScroll = () => {
    const listElement = listRef.current;
    if (!listElement || !hasOlderMessages || isLoadingOlder || !onLoadOlderMessages) return;
    if (listElement.scrollTop > 80) return;

    olderScrollPositionRef.current = {
      scrollHeight: listElement.scrollHeight,
      scrollTop: listElement.scrollTop,
    };
    onLoadOlderMessages();
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-8 text-sm text-[#65676b]">
        Loading messages...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-8 text-sm text-red-500">
        {error}
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-8 text-sm text-[#65676b]">
        No messages yet. Send a message to start the conversation.
      </div>
    );
  }

  return (
    <div ref={listRef} onScroll={handleScroll} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
      {hasOlderMessages && (
        <div className="flex h-8 items-center justify-center text-xs font-semibold text-[#65676b]">
          {isLoadingOlder ? "Loading older messages..." : "Scroll up for older messages"}
        </div>
      )}
      {messages.map((message, index) => {
        const isMine = message.senderId === currentUserId;
        const isCallMessage = message.type === "call";
        const messageDayKey = getMessageDayKey(message.createdAt);
        const previousMessageDayKey = getMessageDayKey(messages[index - 1]?.createdAt);
        const shouldShowTimeDivider = messageDayKey && messageDayKey !== previousMessageDayKey;
        const fullTimeLabel = formatFullMessageTime(message.createdAt);
        const bubbleClassName = message.isDeleted
          ? "bg-[#f0f2f5] text-[#65676b]"
          : isMine
            ? "bg-blue-500 text-white"
            : "bg-[#f0f2f5] text-[#1c1e21]";

        return (
          <div key={message._id} className="space-y-3">
            {shouldShowTimeDivider && (
              <div className="flex justify-center">
                <span className="rounded-full bg-[#f0f2f5] px-3 py-1 text-[11px] font-semibold text-[#65676b]">
                  {formatMessengerTime(message.createdAt)}
                </span>
              </div>
            )}

            <div className={`group flex w-full ${isMine ? "justify-end" : "justify-start"}`}>
              {!isMine && isGroupChat && (
                <img
                  src={message.senderAvatar || "https://i.pravatar.cc/100?img=1"}
                  alt={message.senderName || "Member"}
                  className="mr-2 mt-1 h-7 w-7 rounded-full object-cover ring-1 ring-black/5"
                />
              )}

              <div className={`relative flex max-w-[75%] flex-col ${isMine ? "items-end" : "items-start"}`}>
                <div
                  className={`peer w-fit max-w-full rounded-2xl px-3 py-2 ${bubbleClassName}`}
                  title={fullTimeLabel}
                >
                  {message.isDeleted ? (
                    <p className="break-words whitespace-pre-wrap text-sm italic">This message was deleted</p>
                  ) : isCallMessage ? (
                    <CallMessageBubble message={message} isMine={isMine} />
                  ) : (
                    <>
                      {message.imageUrl && (
                        <img
                          src={message.imageUrl}
                          alt=""
                          className="mb-2 max-h-[280px] max-w-full rounded-xl object-contain"
                        />
                      )}
                      {message.text && <p className="break-words whitespace-pre-wrap text-sm">{message.text}</p>}
                    </>
                  )}
                </div>
                {fullTimeLabel && (
                  <span
                    className={`pointer-events-none absolute top-1/2 z-10 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-[#242526] px-2 py-1 text-[11px] font-semibold text-white shadow-lg peer-hover:block ${
                      isMine ? "right-full mr-2" : "left-full ml-2"
                    }`}
                  >
                    {fullTimeLabel}
                  </span>
                )}

                {isMine && !message.isDeleted && !isCallMessage && (
                  <>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenuId((prevId) => (prevId === message._id ? null : message._id));
                      }}
                      className="absolute -bottom-2 -left-8 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#65676b] opacity-0 shadow transition hover:bg-[#f0f2f5] group-hover:opacity-100"
                      aria-label="Open message actions"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M3 10a2 2 0 114 0 2 2 0 01-4 0zm5 0a2 2 0 114 0 2 2 0 01-4 0zm5 0a2 2 0 114 0 2 2 0 01-4 0z" />
                      </svg>
                    </button>

                    {openMenuId === message._id && (
                      <div
                        onClick={(event) => event.stopPropagation()}
                        className="absolute -bottom-2 -left-36 z-10 min-w-[120px] rounded-md border border-[#e4e6eb] bg-white py-1 shadow-lg"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (onDeleteMessage) onDeleteMessage(message._id);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-red-500 transition hover:bg-red-50"
                        >
                          Delete message
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
