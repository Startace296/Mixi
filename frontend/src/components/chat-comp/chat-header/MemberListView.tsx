import { useState } from "react";

import ConfirmDialog from "../../common/ConfirmDialog";
import type { MemberHandler } from "./types";
import { getAvatarUrl } from "../../../lib/format";
import { getErrorMessage } from "../../../lib/errors";
import type { AuthUser, ChatThread, Id, User } from "../../../types";

/* ─── Member List View ──────────────────────────────────────── */
interface MemberListViewProps {
  chat: ChatThread;
  currentUser: AuthUser | null | undefined;
  isOwner: boolean;
  onAddMember: () => void;
  onRemoveMember?: MemberHandler;
  onViewProfile: (userId: Id) => void;
}

export default function MemberListView({ chat, currentUser, isOwner, onAddMember, onRemoveMember, onViewProfile }: MemberListViewProps) {
  const [search, setSearch] = useState("");
  const [kickTarget, setKickTarget] = useState<User | null>(null); // member to confirm kick
  const members = chat.members ?? [];
  const filtered = members.filter((m) =>
    (m.displayName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Kick confirmation dialog */}
      {kickTarget && (
        <ConfirmDialog
          title={`Kick ${kickTarget.displayName}?`}
          description={`${kickTarget.displayName} will be removed from this group.`}
          confirmLabel="Kick"
          onConfirm={async () => {
            const target = kickTarget;
            setKickTarget(null);
            try { await onRemoveMember?.(target); }
            catch (err) { window.alert(getErrorMessage(err, "Failed to remove member")); }
          }}
          onCancel={() => setKickTarget(null)}
        />
      )}

      <div className="flex flex-col gap-3">
        {/* Search bar */}
        <div className="relative">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8d91]"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full rounded-full border border-[#dddfe2] bg-[#f0f2f5] py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-indigo-400 focus:bg-white"
          />
        </div>

        {/* Member list */}
        <div className="max-h-64 overflow-y-auto space-y-0.5 pr-1">
          {members.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <svg className="h-9 w-9 text-[#ccd0d5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
              <p className="text-sm text-[#65676b]">No members yet.</p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#8a8d91]">No members match &ldquo;{search}&rdquo;.</p>
          ) : (
            filtered.map((m) => {
              const isSelf = String(m.id) === String(currentUser?.id);
              const isGroupOwner = String(m.id) === String(chat.ownerId);
              return (
                <div key={m.id} className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-[#f0f2f5]">
                  {/* Clickable avatar + name → view profile */}
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    onClick={() => onViewProfile?.(m.id)}
                  >
                    <img
                      src={getAvatarUrl(m.avatarUrl)}
                      alt={m.displayName}
                      className="h-8 w-8 shrink-0 rounded-full object-cover"
                      onError={(e) => { e.currentTarget.src = "/basic_avatar.jpg"; }}
                    />
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[#1c1e21]">
                      {m.displayName}
                      {isSelf && <span className="ml-1 font-normal text-[#8a8d91]">(You)</span>}
                      {isGroupOwner && <span className="ml-1 font-normal text-indigo-600">(Owner)</span>}
                    </p>
                  </button>
                  {isOwner && !isSelf && (
                    <button
                      type="button"
                      className="shrink-0 rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50 hover:border-red-300"
                      onClick={() => setKickTarget(m)}
                    >
                      Kick
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Add member */}
        {isOwner && (
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-lg border border-dashed border-[#dddfe2] px-3 py-2.5 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
            onClick={onAddMember}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add member
          </button>
        )}
      </div>
    </>
  );
}
