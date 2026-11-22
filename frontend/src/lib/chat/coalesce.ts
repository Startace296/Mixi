import { compareTimelineKeys } from './receipts';
import type { Id, ISODateString } from '../../types';

interface AckableMessage {
  _id: Id;
  createdAt: ISODateString;
}

/**
 * Batches delivery acks. A burst of N incoming messages in one conversation becomes a
 * single ack for the furthest one (a watermark covers everything before it), sent
 * `delayMs` after the first. Messages at or behind what was already acked are dropped.
 */
export function createDeliveryAcker(
  send: (conversationId: Id, messageId: Id) => void,
  { delayMs = 250 }: { delayMs?: number } = {},
) {
  const pending = new Map<string, AckableMessage>();
  const acked = new Map<string, AckableMessage>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const keyOf = (message: AckableMessage) => ({ at: message.createdAt, id: message._id });
  const isBeyond = (candidate: AckableMessage, than: AckableMessage | undefined) => (
    !than || compareTimelineKeys(keyOf(candidate), keyOf(than)) > 0
  );

  function flush() {
    timer = null;
    for (const [conversationId, message] of pending) {
      acked.set(conversationId, message);
      send(conversationId, message._id);
    }
    pending.clear();
  }

  return {
    queue(conversationId: Id, message: AckableMessage) {
      const key = String(conversationId);
      if (!isBeyond(message, acked.get(key)) || !isBeyond(message, pending.get(key))) return;
      pending.set(key, message);
      if (!timer) timer = setTimeout(flush, delayMs);
    },
    flush() {
      if (timer) clearTimeout(timer);
      flush();
    },
    dispose() {
      if (timer) clearTimeout(timer);
      timer = null;
      pending.clear();
    },
  };
}

/**
 * Runs `task` one call at a time, per key. Calls made while one is in flight collapse
 * into a single follow-up with the latest argument, so the last request always runs
 * and nothing older ever lands after it.
 */
export function createLatestOnlyRunner<T>(task: (key: string, arg: T) => Promise<unknown>) {
  const running = new Set<string>();
  const queued = new Map<string, T>();

  async function start(key: string, arg: T) {
    running.add(key);
    try {
      await task(key, arg);
    } catch {
      // A failed run is superseded by the next one; callers do not wait on it.
    } finally {
      running.delete(key);
      if (queued.has(key)) {
        const next = queued.get(key) as T;
        queued.delete(key);
        void start(key, next);
      }
    }
  }

  return {
    run(key: string, arg: T) {
      if (running.has(key)) {
        queued.set(key, arg);
        return;
      }
      void start(key, arg);
    },
  };
}
