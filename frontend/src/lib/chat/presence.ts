import type { PresenceStatus } from '../../types';

export interface PresenceMeta {
  label: string;
  dotClassName: string;
}

/** Groups send `presenceStatus: ''`; anything that is not online/away renders as offline. */
type PresenceInput = PresenceStatus | '' | null | undefined;

export function getPresenceMeta(status: PresenceInput): PresenceMeta {
  if (status === "online") return { label: "Online", dotClassName: "bg-emerald-500" };
  if (status === "away") return { label: "Away", dotClassName: "bg-amber-400" };
  return { label: "Offline", dotClassName: "bg-[#bcc0c4]" };
}

export function getPresenceDotClassName(status: PresenceInput): string {
  if (status === "online") return "bg-emerald-500";
  if (status === "away") return "bg-amber-400";
  return "bg-[#bcc0c4]";
}
