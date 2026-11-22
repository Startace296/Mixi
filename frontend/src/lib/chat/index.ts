/** Pure helpers and constants for chat state (no React, no network). */
export { MESSAGE_PAGE_LIMIT, MAX_MESSAGE_PAGE_LIMIT, TYPING_IDLE_MS, REMOTE_TYPING_TTL_MS, UNREAD_SUMMARIZE_THRESHOLD } from './constants';
export { getConversationSortTime, formatConversationPreview, mergeConversation, mergeConversationList } from './conversations';
export {
  appendMessageOnce,
  createClientMessageId,
  applyDeletedMessageIds,
  getMessageDayKey,
  getDeletedMessagePatch,
  getInitialPageLimit,
  getNewestCursor,
  mergeNewerMessages,
  mergeOlderMessages,
  replaceWithLatestPage,
} from './messages';
export { compareTimelineKeys, getOutgoingStatus, mergeReceipt, mergeReceipts } from './receipts';
export type { OutgoingStatus } from './receipts';
export { createDeliveryAcker, createLatestOnlyRunner } from './coalesce';
export { getPresenceMeta, getPresenceDotClassName } from './presence';
export type { PresenceMeta } from './presence';
