import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";

import ConfirmDialog from "../../common/ConfirmDialog";
import AddMemberView from "./AddMemberView";
import MemberListView from "./MemberListView";
import type { GroupUpdates, MemberHandler } from "./types";
import { getAvatarUrl } from "../../../lib/format";
import { getErrorMessage } from "../../../lib/errors";
import type { AuthUser, ChatThread } from "../../../types";

/* ─── Edit Group Modal ─────────────────────────────────────── */
interface EditGroupModalProps {
  chat: ChatThread;
  currentUser: AuthUser | null | undefined;
  onClose: () => void;
  onUpdateGroup?: (updates: GroupUpdates) => void | Promise<void>;
  onAddMember?: MemberHandler;
  onRemoveMember?: MemberHandler;
  onDelete?: () => void | Promise<void>;
  onLeave?: () => void | Promise<void>;
}

type EditGroupView = "edit" | "members" | "add-member";

export default function EditGroupModal({ chat, currentUser, onClose, onUpdateGroup, onAddMember, onRemoveMember, onDelete, onLeave }: EditGroupModalProps) {
  const navigate = useNavigate();
  const [view, setView] = useState<EditGroupView>("edit");
  const [name, setName] = useState(chat.name || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwner = !chat.ownerId || String(chat.ownerId) === String(currentUser?.id);
  const memberCount = chat.members?.length ?? chat.memberCount ?? "—";
  const displayAvatar = avatarPreview || getAvatarUrl(chat.profilePic, "group");

  useEffect(() => { setName(chat.name || ""); }, [chat.name]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (view === "add-member") setView("members");
      else if (view === "members") setView("edit");
      else onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [view, onClose]);

  // ── Dirty tracking ─────────────────────────────────────────
  const nameChanged = name.trim() !== (chat.name || "").trim() && name.trim() !== "";
  const avatarChanged = avatarFile !== null;
  const isDirty = nameChanged || avatarChanged;

  const handleSave = async () => {
    const updates: GroupUpdates = {};
    if (nameChanged) updates.name = name.trim();
    if (avatarChanged) updates.avatar = avatarFile;
    try {
      await onUpdateGroup?.(updates);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
      setAvatarFile(null);
    } catch (err) {
      window.alert(getErrorMessage(err, "Failed to update group"));
    }
  };

  const handleCancel = () => {
    setName(chat.name || "");
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setAvatarFile(null);
  };

  // ── Avatar ─────────────────────────────────────────────────
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>

          {/* Delete group confirmation */}
          {deleteConfirm && (
            <ConfirmDialog
              title="Delete group chat?"
              description={`"${chat.name || "This group"}" and all its messages will be permanently deleted.`}
              confirmLabel="Delete"
              onConfirm={() => { setDeleteConfirm(false); onDelete?.(); }}
              onCancel={() => setDeleteConfirm(false)}
            />
          )}

          {/* ── Header ─────────────────────────────────── */}
          <div className="flex items-center gap-2 border-b border-[#f0f2f5] px-4 py-4">
            {view !== "edit" ? (
              <button
                type="button"
                onClick={() => setView(view === "add-member" ? "members" : "edit")}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#65676b] transition hover:bg-[#f0f2f5]"
                aria-label="Back"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
            ) : (
              <div className="h-7 w-7 shrink-0" />
            )}

            <h2 className="flex-1 text-center text-base font-bold text-[#1c1e21]">
              {view === "add-member" ? "Add Member" : view === "members" ? "Member List" : "Edit Group"}
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#65676b] transition hover:bg-[#f0f2f5]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── Body ───────────────────────────────────── */}
          <div className="px-5 py-5">
            {view === "add-member" ? (
              <AddMemberView
                chat={chat}
                onAddMember={onAddMember}
                onViewProfile={(userId) => { navigate(`/profile/${userId}`); onClose(); }}
              />
            ) : view === "members" ? (
              <MemberListView
                chat={chat}
                currentUser={currentUser}
                isOwner={isOwner}
                onAddMember={() => setView("add-member")}
                onRemoveMember={onRemoveMember}
                onViewProfile={(userId) => { navigate(`/profile/${userId}`); onClose(); }}
              />
            ) : (
              <div className="space-y-4">

                {/* Avatar */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <img src={displayAvatar} alt="Group avatar" className="h-20 w-20 rounded-full object-cover ring-2 ring-[#e4e6eb]" />
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md transition hover:bg-indigo-700"
                      aria-label="Change group photo">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                      </svg>
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleFileChange} />
                  </div>
                  <p className="text-[11px] text-[#8a8d91]">Group photo</p>
                </div>

                {/* Group name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-[#65676b]">Group name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Group name"
                    maxLength={80}
                    className="rounded-lg border border-[#dddfe2] px-4 py-2.5 text-sm text-[#1c1e21] outline-none transition-colors focus:border-indigo-500"
                  />
                </div>

                {/* Members row — click ⋯ → navigate to member list */}
                <div className="flex items-center justify-between rounded-lg border border-[#e4e6eb] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 shrink-0 text-[#65676b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                    <span className="text-sm font-semibold text-[#1c1e21]">Members</span>
                    <span className="rounded-full bg-[#f0f2f5] px-2 py-0.5 text-xs font-semibold text-[#65676b]">{memberCount}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setView("members")}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#65676b] transition hover:bg-[#f0f2f5]"
                    aria-label="View member list"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 10a2 2 0 114 0 2 2 0 01-4 0zm5 0a2 2 0 114 0 2 2 0 01-4 0zm5 0a2 2 0 114 0 2 2 0 01-4 0z" />
                    </svg>
                  </button>
                </div>

                {/* Danger zone */}
                <div className="rounded-lg border border-red-100 bg-red-50/50 px-4 py-3">
                  {isOwner ? (
                    <button type="button" onClick={() => setDeleteConfirm(true)}
                      className="flex w-full items-center gap-2.5 text-sm font-semibold text-red-600 transition hover:text-red-700">
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                      Delete group chat
                    </button>
                  ) : (
                    <button type="button" onClick={onLeave}
                      className="flex w-full items-center gap-2.5 text-sm font-semibold text-red-600 transition hover:text-red-700">
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                      </svg>
                      Leave group
                    </button>
                  )}
                </div>

                {/* Save / Cancel — only when name or avatar changed */}
                {isDirty && (
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 rounded-full border border-[#e4e6eb] py-2 text-sm font-semibold text-[#65676b] transition hover:bg-[#f0f2f5]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="flex-1 rounded-full bg-indigo-600 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
