import type { CallMode, Conversation } from './chat';
import type { Id } from './common';
import type { User } from './user';

export type CallPhase = 'outgoing_ringing' | 'incoming_ringing' | 'in_call';

/** Local state of the voice call UI (owned by useVoiceCall, rendered by ChatCallOverlay). */
export interface CallState {
  isOpen: boolean;
  phase: CallPhase;
  mode: CallMode;
  callId: string;
  conversationId: Id;
  peerUserId: Id;
  peerName: string;
  peerAvatarUrl: string;
  isMicOn: boolean;
  isCamOn: boolean;
  error: string;
}

/** The chat a call is started from; `otherUserId` is accepted for older thread shapes. */
export type CallableChat = Partial<
  Pick<Conversation, 'id' | 'conversationId' | 'type' | 'friendId' | 'name' | 'profilePic' | 'avatarUrl'>
> & {
  otherUserId?: Id | null;
};

/** The signed-in user; `name` / `profilePic` are fallbacks for older user shapes. */
export type CallCurrentUser = Partial<Pick<User, 'displayName' | 'avatarUrl'>> & {
  name?: string;
  profilePic?: string;
};
