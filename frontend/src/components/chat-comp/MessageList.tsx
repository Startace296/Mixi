import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getMessageDayKey, getOutgoingStatus } from "../../lib/chat";
import { useChatSummarize, useFrozenUnreadMarkers, useMessageListScroll } from "../../hooks/chat";
import { formatMessengerTime } from "../../lib/format";
import MessageBubble from "./MessageBubble";
import MessageStatus from "./MessageStatus";
import SummarizePanel from "./UnreadSummarizePanel";
import { SummarizeUnreadButton, UnreadCountBanner } from "./UnreadMessageMarkers";
import type { ChatMessage, Id, MessageReceipt, User } from "../../types";

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: Id | null | undefined;
  isGroupChat: boolean;
  onDeleteMessage?: (messageId: Id) => void;
  isLoading?: boolean;
  hasOlderMessages?: boolean;
  isLoadingOlder?: boolean;
  /** Set when the last older-page request failed; shown inline with a retry. */
  olderError?: string;
  onLoadOlderMessages?: () => void;
  error?: string;
  initialUnreadCount?: number;
  threadId?: Id | null;
  onApplySuggestedReply?: (reply: string) => void;
  /** Members' delivery / read watermarks, for the status under my latest message. */
  receipts?: MessageReceipt[];
  members?: Pick<User, "id" | "displayName">[];
  /** For my messages whose send failed. */
  onRetryMessage?: (messageId: Id) => void;
  onDiscardMessage?: (messageId: Id) => void;
}

const NO_MEMBERS: Pick<User, "id" | "displayName">[] = [];

const NO_MESSAGES: ChatMessage[] = [];

function ListStatus({ children, className = "text-[#65676b]" }: { children?: ReactNode; className?: string }) {
  return (
    <div className={`flex h-full items-center justify-center px-4 py-8 text-sm ${className}`}>
      {children}
    </div>
  );
}

const SKELETON_ROWS = [
  { mine: false, width: "w-40" },
  { mine: false, width: "w-56" },
  { mine: true, width: "w-32" },
  { mine: false, width: "w-48" },
  { mine: true, width: "w-60" },
  { mine: true, width: "w-24" },
];

/** Bubble-shaped placeholders, so the first page does not pop in from a blank panel. */
function MessageListSkeleton() {
  return (
    <div className="flex h-full flex-col justify-end gap-2" aria-busy="true">
      <span className="sr-only">Loading messages...</span>
      {SKELETON_ROWS.map((row, index) => (
        <div key={index} className={`flex ${row.mine ? "justify-end" : "justify-start"}`} aria-hidden="true">
          <div className={`h-9 animate-pulse rounded-2xl ${row.width} ${row.mine ? "bg-[#0866ff]/15" : "bg-[#f0f2f5]"}`} />
        </div>
      ))}
    </div>
  );
}

/**
 * Fixed-height row above the first message. Its height never changes between states,
 * so switching between them cannot nudge the messages below.
 */
function OlderMessagesStatus({
  hasOlderMessages,
  isLoadingOlder,
  olderError,
  onRetry,
}: {
  hasOlderMessages: boolean;
  isLoadingOlder: boolean;
  olderError: string;
  onRetry?: () => void;
}) {
  let content: ReactNode;
  if (!hasOlderMessages) {
    content = "This is the beginning of the conversation";
  } else if (olderError) {
    content = (
      <span role="alert" className="text-red-500">
        {olderError}.{" "}
        <button type="button" onClick={onRetry} className="font-semibold text-[#0866ff] hover:underline">
          Retry
        </button>
      </span>
    );
  } else if (isLoadingOlder) {
    content = (
      <span className="inline-flex items-center gap-2">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#bcc0c4] border-t-[#0866ff]" aria-hidden="true" />
        Loading older messages...
      </span>
    );
  } else {
    content = "Scroll up for older messages";
  }

  return (
    <div className="flex h-8 items-center justify-center text-xs font-semibold text-[#65676b]">
      {content}
    </div>
  );
}

function JumpToLatestButton({ unseenCount, onClick }: { unseenCount: number; onClick: () => void }) {
  const label = unseenCount > 0
    ? `${unseenCount} new message${unseenCount === 1 ? "" : "s"}`
    : "Jump to latest";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="absolute bottom-3 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#e4e6eb] bg-white px-3 py-1.5 text-xs font-semibold text-[#0866ff] shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition hover:bg-[#f0f2f5]"
    >
      <span aria-hidden="true">↓</span>
      {label}
    </button>
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
  olderError = "",
  onLoadOlderMessages,
  error = "",
  initialUnreadCount = 0,
  threadId = null,
  onApplySuggestedReply,
  receipts,
  members = NO_MEMBERS,
  onRetryMessage,
  onDiscardMessage,
}: MessageListProps) {
  const [openMenuId, setOpenMenuId] = useState<Id | null>(null);
  // Messages that arrive while the first page is loading are not on screen yet.
  const renderedMessages = isLoading || error ? NO_MESSAGES : messages;

  const summarize = useChatSummarize({ conversationId: threadId, onApplySuggestedReply, messages });
  const { markers, showUnreadUi } = useFrozenUnreadMarkers({
    messages: renderedMessages,
    initialUnreadCount,
    threadId,
    unreadUiDismissed: summarize.unreadUiDismissed,
  });

  const scroll = useMessageListScroll({
    threadId,
    messages: renderedMessages,
    currentUserId,
    hasOlderMessages,
    isLoadingOlder,
    canAutoLoadOlder: !olderError,
    onLoadOlderMessages,
    initialTargetId: showUnreadUi ? markers?.firstId : null,
  });

  useEffect(() => {
    const handleWindowClick = () => setOpenMenuId(null);
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

  // Status goes under my latest confirmed message (Messenger-style, one place instead of
  // ticks on every bubble), plus "Sending…" under each message still in flight.
  const latestConfirmedMineId = useMemo(() => {
    for (let index = renderedMessages.length - 1; index >= 0; index -= 1) {
      const message = renderedMessages[index];
      if (message.senderId === currentUserId && !message._optimistic && !message.isDeleted) return message._id;
    }
    return null;
  }, [renderedMessages, currentUserId]);

  const latestStatus = useMemo(() => {
    const message = renderedMessages.find((item) => item._id === latestConfirmedMineId);
    if (!message) return null;
    const { status, readBy } = getOutgoingStatus(message, {
      receipts,
      memberIds: members.map((member) => member.id),
      currentUserId,
    });
    const readerIds = new Set(readBy.map(String));
    return { status, readers: members.filter((member) => readerIds.has(String(member.id))) };
  }, [renderedMessages, latestConfirmedMineId, receipts, members, currentUserId]);

  let body: ReactNode = null;
  if (isLoading) body = <MessageListSkeleton />;
  else if (error) body = <ListStatus className="text-red-500">{error}</ListStatus>;
  else if (!messages.length) {
    body = <ListStatus>No messages yet. Send a message to start the conversation.</ListStatus>;
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={scroll.listRef}
        onScroll={scroll.handleScroll}
        role="log"
        aria-label="Messages"
        aria-busy={isLoading || isLoadingOlder}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [overflow-anchor:none]"
      >
        {body ?? (
          <div ref={scroll.contentRef} className="space-y-1">
            <OlderMessagesStatus
              hasOlderMessages={hasOlderMessages}
              isLoadingOlder={isLoadingOlder}
              olderError={olderError}
              onRetry={onLoadOlderMessages}
            />

            {messages.map((message, index) => {
              const isMine = message.senderId === currentUserId;
              const messageDayKey = getMessageDayKey(message.createdAt);
              const previousMessageDayKey = getMessageDayKey(messages[index - 1]?.createdAt);
              const shouldShowTimeDivider = messageDayKey && messageDayKey !== previousMessageDayKey;

              return (
                <div key={message._id} data-message-id={message._id} className="space-y-2">
                  {showUnreadUi && markers && message._id === markers.firstId && (
                    <UnreadCountBanner count={markers.count} />
                  )}

                  {shouldShowTimeDivider && (
                    <div className="flex justify-center">
                      <span className="rounded-full bg-[#f0f2f5] px-3 py-1 text-[11px] font-semibold text-[#65676b]">
                        {formatMessengerTime(message.createdAt)}
                      </span>
                    </div>
                  )}

                  <div data-scroll-anchor={message._id}>
                    <MessageBubble
                      message={message}
                      isMine={isMine}
                      isGroupChat={isGroupChat}
                      openMenuId={openMenuId}
                      onToggleMenu={(messageId) => (
                        setOpenMenuId((prevId) => (prevId === messageId ? null : messageId))
                      )}
                      onDeleteMessage={(messageId) => {
                        onDeleteMessage?.(messageId);
                        setOpenMenuId(null);
                      }}
                      onSummarizeFrom={(messageId) => summarize.openFromMessage(messageId)}
                    />
                  </div>

                  {showUnreadUi && markers && message._id === markers.lastId && (
                    <SummarizeUnreadButton onClick={() => summarize.open(markers)} />
                  )}

                  {isMine && message._optimistic && (
                    <MessageStatus
                      status={message._failed ? "failed" : "sending"}
                      isGroupChat={isGroupChat}
                      readers={[]}
                      onRetry={() => onRetryMessage?.(message._id)}
                      onDiscard={() => onDiscardMessage?.(message._id)}
                    />
                  )}
                  {message._id === latestConfirmedMineId && latestStatus && (
                    <MessageStatus status={latestStatus.status} isGroupChat={isGroupChat} readers={latestStatus.readers} />
                  )}
                </div>
              );
            })}

            <SummarizePanel
              isOpen={summarize.isOpen}
              isFromMessageMode={summarize.isFromMessageMode}
              unreadCount={markers?.count ?? initialUnreadCount}
              isLoadingSummary={summarize.isLoadingSummary}
              summaryBullets={summarize.summaryBullets}
              isLoadingSuggestions={summarize.isLoadingSuggestions}
              suggestions={summarize.suggestions}
              showSuggestions={summarize.showSuggestions}
              onClose={summarize.close}
              onSuggestResponses={summarize.suggestResponses}
              onSelectSuggestion={summarize.selectSuggestion}
            />
          </div>
        )}
      </div>

      {scroll.showJumpButton && (
        <JumpToLatestButton unseenCount={scroll.unseenCount} onClick={scroll.scrollToBottom} />
      )}
    </div>
  );
}
