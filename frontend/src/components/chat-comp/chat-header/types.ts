import type { GroupMemberRef } from "../../../types";

export type MemberHandler = (member: GroupMemberRef) => void | Promise<void>;

export interface GroupUpdates {
  name?: string;
  avatar?: File | null;
}
