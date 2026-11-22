import { useState, type ReactNode } from "react";

import { getAvatarUrl } from "../../lib/format";
import { getPresenceMeta } from "../../lib/chat";
import EditGroupModal from "./chat-header/EditGroupModal";
import type { GroupUpdates, MemberHandler } from "./chat-header/types";
import type { AuthUser, ChatThread } from "../../types";

/* ─── Chat Header ──────────────────────────────────────────── */
interface ChatHeaderProps {
  chat: ChatThread;
  currentUser: AuthUser | null | undefined;
  /** Video is wired in the UI but not passed by ChatSectionView yet. */
  onCall?: { voice?: () => void; video?: () => void };
  onOpenProfile?: () => void;
  canOpenProfile?: boolean;
  onUpdateGroup?: (updates: GroupUpdates) => void | Promise<void>;
  onAddMember?: MemberHandler;
  onRemoveMember?: MemberHandler;
  onDeleteGroup?: () => void | Promise<void>;
  onLeaveGroup?: () => void | Promise<void>;
}

export default function ChatHeader({ chat, currentUser, onCall, onOpenProfile, canOpenProfile = true, onUpdateGroup, onAddMember, onRemoveMember, onDeleteGroup, onLeaveGroup }: ChatHeaderProps) {
  const presence = getPresenceMeta(chat.presenceStatus);
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const isGroup = chat.type === "group";

  const renderCallBtn = (onClick: (() => void) | undefined, label: string, children: ReactNode) => (
    <div className="group relative">
      <button type="button" id={`call-btn-${label.toLowerCase().replace(/\s/g, "-")}`} onClick={onClick} aria-label={label}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[#65676b] transition hover:bg-violet-50 hover:text-violet-600 active:scale-95">
        {children}
      </button>
      <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: "rgba(28,30,33,0.85)", zIndex: 10 }}>{label}</span>
    </div>
  );

  const avatarEl = (
      <span className="relative block h-10 w-10">
        <img src={getAvatarUrl(chat.profilePic, chat.type)} alt={chat.name} className="h-10 w-10 rounded-full object-cover" />
        {!isGroup && <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${presence.dotClassName}`} />}
      </span>
  );

  return (
      <>
        <header className="flex items-center justify-between border-b border-[#e4e6eb] bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            {isGroup ? (
              <button type="button" onClick={() => setEditGroupOpen(true)} className="rounded-full focus:outline-none" aria-label="Edit group">{avatarEl}</button>
            ) : canOpenProfile ? (
              <button type="button" onClick={onOpenProfile} className="rounded-full focus:outline-none" aria-label={`Open ${chat.name} profile`}>{avatarEl}</button>
            ) : avatarEl}
            <div>
              {isGroup ? (
                <button type="button" onClick={() => setEditGroupOpen(true)} className="font-semibold text-[#1c1e21] hover:underline">{chat.name}</button>
              ) : canOpenProfile ? (
                <button type="button" onClick={onOpenProfile} className="font-semibold text-[#1c1e21] hover:underline">{chat.name}</button>
              ) : (
                <p className="font-semibold text-[#1c1e21]">{chat.name}</p>
              )}
              <p className="text-xs text-[#65676b]">{isGroup ? "Group chat" : presence.label}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onCall?.voice && renderCallBtn(onCall.voice, "Voice call", (
              <svg className="h-[18px] w-[18px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            ))}
            {onCall?.video && renderCallBtn(onCall.video, "Video call", (
              <svg className="h-[18px] w-[18px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            ))}
          </div>
        </header>

        {editGroupOpen && (
          <EditGroupModal
            chat={chat}
            currentUser={currentUser}
            onClose={() => setEditGroupOpen(false)}
            onUpdateGroup={onUpdateGroup}
            onAddMember={onAddMember}
            onRemoveMember={onRemoveMember}
            onDelete={() => { setEditGroupOpen(false); onDeleteGroup?.(); }}
            onLeave={() => { setEditGroupOpen(false); onLeaveGroup?.(); }}
          />
        )}
      </>
      );
}
