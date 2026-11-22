import { formatPostCreatedAtDisplay } from "../../../../lib/format";
import type { Id, ISODateString, OpenProfileHandler, ProfileTarget } from "../../../../types";

export function commentCreatedAtLabel(raw: ISODateString | Date | null | undefined): string {
  if (raw == null) return "";
  const d = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  return formatPostCreatedAtDisplay(d);
}

export function openAuthorProfile(
  onOpenProfile: OpenProfileHandler | undefined,
  authorId: Id | null | undefined,
  displayName?: string,
  avatarUrl?: string,
) {
  if (!onOpenProfile || authorId == null || String(authorId).trim() === "") return;
  const payload: ProfileTarget = { id: String(authorId) };
  if (displayName) payload.displayName = displayName;
  if (avatarUrl) payload.avatarUrl = avatarUrl;
  onOpenProfile(payload);
}
