import { useEffect, useState } from "react";

import type { MemberHandler } from "./types";
import { getFriends } from "../../../lib/api";
import { getAvatarUrl } from "../../../lib/format";
import { getErrorMessage } from "../../../lib/errors";
import type { ChatThread, Friend, Id, User } from "../../../types";

/** Friend rows may also carry `_id` from older API shapes; `id` wins when both exist. */
type FriendRow = Friend & { _id?: Id };

/* ─── Add Member View ───────────────────────────────────────── */
interface AddMemberViewProps {
  chat: ChatThread;
  onAddMember?: MemberHandler;
  onViewProfile: (userId: Id) => void;
}

export default function AddMemberView({ chat, onAddMember, onViewProfile }: AddMemberViewProps) {
  const [search, setSearch] = useState("");
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(new Set<string>());

  const memberIds = new Set((chat.members ?? []).map((m: User & { _id?: Id }) => String(m.id ?? m._id)));

  useEffect(() => {
        let isMounted = true;

      setLoading(true);
      getFriends({q: search || undefined, limit: 50 })
      .then((data) => {
        if (!isMounted) return;
      setFriends(data?.friends || []);
      })
      .catch(() => {
        if (isMounted) setFriends([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    
    return () => {
        isMounted = false;
    };
  }, [search]);

  const eligible = friends.filter((f) => {
    const fid = String(f.id ?? f._id);
      return (
      !memberIds.has(fid) &&
      !added.has(fid) &&
      (f.displayName || "").toLowerCase().includes(search.toLowerCase())
      );
  });

  const handleAdd = async (f: FriendRow) => {
    const fid = String(f.id ?? f._id);
      try {
        await onAddMember?.(f);
      setAdded((prev) => new Set([...prev, fid]));
    } catch (err) {
        window.alert(getErrorMessage(err, "Failed to add member"));
    }
  };

      return (
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8d91]"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friends..."
            className="w-full rounded-full border border-[#dddfe2] bg-[#f0f2f5] py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-indigo-400 focus:bg-white"
          />
        </div>

        {/* List */}
        <div className="max-h-64 overflow-y-auto space-y-0.5 pr-1">
          {loading ? (
            <p className="py-6 text-center text-sm text-[#8a8d91]">Loading friends...</p>
          ) : eligible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <svg className="h-8 w-8 text-[#ccd0d5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              <p className="text-sm text-[#65676b]">
                {search ? `No friends match "${search}"` : "All friends are already in the group."}
              </p>
            </div>
          ) : (
            eligible.map((f) => (
              <div key={f.id ?? f._id} className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-[#f0f2f5]">
                {/* Clickable avatar + name → view profile */}
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => onViewProfile?.(f.id ?? f._id)}
                >
                  <img
                    src={getAvatarUrl(f.avatarUrl)}
                    alt={f.displayName}
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                    onError={(e) => { e.currentTarget.src = "/basic_avatar.jpg"; }}
                  />
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[#1c1e21]">{f.displayName}</p>
                </button>
                <button
                  type="button"
                  className="shrink-0 rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-700"
                  onClick={() => handleAdd(f)}
                >
                  Add
                </button>
              </div>
            ))
          )}
        </div>
      </div>
  );
}
