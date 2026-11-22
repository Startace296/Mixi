import type { ChatMessage, Id, ISODateString, MessageReceipt, OutgoingMessageStatus } from '../../types';

/** A position on the timeline: the (createdAt, _id) order the server pages and acks by. */
interface TimelineKey {
  at: ISODateString | Date | null | undefined;
  id: Id | null | undefined;
}

/**
 * Orders two timeline positions; null/undefined sorts first ("nothing yet").
 * Object ids are fixed-length lowercase hex, so string order is id order.
 */
export function compareTimelineKeys(left: TimelineKey, right: TimelineKey): number {
  const leftTime = left.at ? new Date(left.at).getTime() : Number.NEGATIVE_INFINITY;
  const rightTime = right.at ? new Date(right.at).getTime() : Number.NEGATIVE_INFINITY;
  if (leftTime !== rightTime) return leftTime < rightTime ? -1 : 1;
  const leftId = String(left.id ?? '');
  const rightId = String(right.id ?? '');
  if (leftId === rightId) return 0;
  return leftId < rightId ? -1 : 1;
}

function furthest(left: TimelineKey, right: TimelineKey): TimelineKey {
  return compareTimelineKeys(left, right) >= 0 ? left : right;
}

/**
 * Combines two copies of one member's receipt by keeping the furthest watermark of each
 * kind. It is commutative and idempotent, so receipt events and conversation payloads
 * can arrive in any order, late, or twice, and the result never moves backwards.
 */
export function mergeReceipt(current: MessageReceipt | undefined, incoming: MessageReceipt): MessageReceipt {
  if (!current) return incoming;
  const delivered = furthest(
    { at: current.deliveredAt, id: current.deliveredMessageId },
    { at: incoming.deliveredAt, id: incoming.deliveredMessageId },
  );
  const read = furthest(
    { at: current.readAt, id: current.readMessageId },
    { at: incoming.readAt, id: incoming.readMessageId },
  );
  return {
    userId: current.userId,
    deliveredAt: (delivered.at as ISODateString | null) ?? null,
    deliveredMessageId: delivered.id ?? null,
    readAt: (read.at as ISODateString | null) ?? null,
    readMessageId: read.id ?? null,
  };
}

/** Merges receipt lists member by member (see mergeReceipt). Returns `current` if nothing moved. */
export function mergeReceipts(
  current: MessageReceipt[] | undefined,
  incoming: MessageReceipt[] | undefined,
): MessageReceipt[] | undefined {
  if (!incoming?.length) return current;
  if (!current?.length) return incoming;

  const byUser = new Map(current.map((receipt) => [String(receipt.userId), receipt]));
  let changed = false;
  for (const receipt of incoming) {
    const key = String(receipt.userId);
    const previous = byUser.get(key);
    const merged = mergeReceipt(previous, receipt);
    if (!previous || !sameReceipt(previous, merged)) {
      byUser.set(key, merged);
      changed = true;
    }
  }
  return changed ? [...byUser.values()] : current;
}

function sameReceipt(left: MessageReceipt, right: MessageReceipt): boolean {
  return compareTimelineKeys({ at: left.deliveredAt, id: left.deliveredMessageId }, { at: right.deliveredAt, id: right.deliveredMessageId }) === 0
    && compareTimelineKeys({ at: left.readAt, id: left.readMessageId }, { at: right.readAt, id: right.readMessageId }) === 0;
}

function covers(receipt: MessageReceipt, kind: 'delivered' | 'read', message: Pick<ChatMessage, '_id' | 'createdAt'>): boolean {
  const watermark = kind === 'read'
    ? { at: receipt.readAt, id: receipt.readMessageId }
    : { at: receipt.deliveredAt, id: receipt.deliveredMessageId };
  return compareTimelineKeys({ at: message.createdAt, id: message._id }, watermark) <= 0;
}

export interface OutgoingStatus {
  status: OutgoingMessageStatus;
  /** Members (other than me) who have read the message. */
  readBy: Id[];
}

/**
 * Status of one of my messages from the other members' watermarks:
 * - sending:   still optimistic (no server copy yet)
 * - sent:      stored on the server
 * - delivered: on every other member's device
 * - read:      read by every other member (in a group, `readBy` lists who has so far)
 * Reading implies delivery, whatever order the two watermarks reached us in.
 */
export function getOutgoingStatus(
  message: Pick<ChatMessage, '_id' | 'createdAt' | '_optimistic' | '_failed'>,
  { receipts, memberIds, currentUserId }: {
    receipts: MessageReceipt[] | undefined;
    memberIds: Id[];
    currentUserId: Id | null | undefined;
  },
): OutgoingStatus {
  if (message._failed) return { status: 'failed', readBy: [] };
  if (message._optimistic) return { status: 'sending', readBy: [] };

  const others = memberIds.map(String).filter((id) => id !== String(currentUserId));
  if (!others.length) return { status: 'sent', readBy: [] };

  const byUser = new Map((receipts || []).map((receipt) => [String(receipt.userId), receipt]));
  const readBy: Id[] = [];
  let deliveredCount = 0;
  for (const memberId of others) {
    const receipt = byUser.get(memberId);
    if (!receipt) continue;
    const hasRead = covers(receipt, 'read', message);
    if (hasRead) readBy.push(memberId);
    if (hasRead || covers(receipt, 'delivered', message)) deliveredCount += 1;
  }

  if (readBy.length === others.length) return { status: 'read', readBy };
  if (deliveredCount === others.length) return { status: 'delivered', readBy };
  return { status: 'sent', readBy };
}
