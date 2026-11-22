import http from "node:http";

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { io as connectClient } from "socket.io-client";

import app from "../../src/app.js";
import Conversation from "../../src/models/Conversation.js";
import Message from "../../src/models/Message.js";
import { initSocket } from "../../src/socket.js";
import { api, bearer } from "../helpers/auth.js";
import { makeFriends, registerUsers } from "../helpers/social.js";

let server;
let baseUrl;

beforeAll(async () => {
  server = http.createServer(app);
  initSocket(server);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

const openClients = new Set();
afterEach(() => {
  for (const client of openClients) client.disconnect();
  openClients.clear();
});

function connect(user) {
  const client = connectClient(baseUrl, {
    auth: { token: user.token },
    transports: ["websocket"],
    forceNew: true,
    reconnection: false,
  });
  openClients.add(client);
  return new Promise((resolve, reject) => {
    client.once("connect", () => resolve(client));
    client.once("connect_error", reject);
  });
}

function nextEvent(client, event, predicate = () => true, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.off(event, handler);
      reject(new Error(`Timed out waiting for "${event}"`));
    }, timeoutMs);
    function handler(payload) {
      if (!predicate(payload)) return;
      clearTimeout(timer);
      client.off(event, handler);
      resolve(payload);
    }
    client.on(event, handler);
  });
}

/** Emits an ack and waits for the server's reply, so the write has happened. */
const ackDelivered = (client, conversationId, messageId) => (
  client.emitWithAck("chat:ack_delivered", { conversationId, messageId })
);

let alice;
let bob;
let carol;
let conversationId;

const as = (user) => ({
  get: (url) => api().get(url).set(bearer(user.token)),
  post: (url, body) => api().post(url).set(bearer(user.token)).send(body),
  patch: (url, body) => api().patch(url).set(bearer(user.token)).send(body),
});

async function send(user, text, id = conversationId) {
  const res = await as(user).post(`/chat/conversations/${id}/messages`, { text }).expect(201);
  return res.body.message;
}

async function unreadOf(user, id = conversationId) {
  const res = await as(user).get("/chat/conversations").expect(200);
  return res.body.conversations.find((conversation) => conversation.id === id).unread;
}

async function receiptOf(userId, id = conversationId) {
  const conversation = await Conversation.findById(id).select("receipts").lean();
  return conversation.receipts?.[String(userId)] || {};
}

beforeEach(async () => {
  ({ alice, bob, carol } = await registerUsers("Alice", "Bob", "Carol"));
  await makeFriends(alice, bob);
  await makeFriends(alice, carol);
  const res = await as(alice).post(`/chat/conversations/direct/${bob.user.id}`).expect(201);
  conversationId = res.body.conversation.id;
});

describe("unread counters under concurrency", () => {
  it("never loses an increment when many messages are sent at the same time", async () => {
    await Promise.all(Array.from({ length: 20 }, (_, i) => send(alice, `burst ${i}`)));
    expect(await unreadOf(bob)).toBe(20);
  });

  it("a read racing incoming messages leaves exactly the messages after the read watermark unread", async () => {
    const seen = [];
    for (let i = 0; i < 5; i += 1) seen.push(await send(alice, `seen ${i}`));

    // Bob reads up to what he saw while Alice keeps sending.
    await Promise.all([
      as(bob).patch(`/chat/conversations/${conversationId}/read`, { upToMessageId: seen[4].id }).expect(200),
      ...Array.from({ length: 5 }, (_, i) => send(alice, `racing ${i}`)),
    ]);

    const watermark = await receiptOf(bob.user.id);
    expect(String(watermark.readMessageId)).toBe(seen[4].id);
    const reallyUnread = await Message.countDocuments({
      conversationId,
      senderId: alice.user.id,
      createdAt: { $gte: watermark.readAt },
      _id: { $ne: watermark.readMessageId },
    });
    expect(reallyUnread).toBe(5);
    expect(await unreadOf(bob)).toBe(5);
  });
});

describe("read receipts", () => {
  it("reading up to a message keeps later ones unread, and a stale read never moves it back", async () => {
    const m1 = await send(alice, "m1");
    const m2 = await send(alice, "m2");
    await send(alice, "m3");
    const url = `/chat/conversations/${conversationId}/read`;

    await as(bob).patch(url, { upToMessageId: m2.id }).expect(200);
    expect(await unreadOf(bob)).toBe(1);

    // An older read (e.g. a slow request from another tab) arrives late.
    await as(bob).patch(url, { upToMessageId: m1.id }).expect(200);
    expect(String((await receiptOf(bob.user.id)).readMessageId)).toBe(m2.id);
    expect(await unreadOf(bob)).toBe(1);

    await as(bob).patch(url, {}).expect(200);
    expect(await unreadOf(bob)).toBe(0);

    await as(bob).patch(url, { upToMessageId: "nope" }).expect(400);
  });

  it("pushes the reader's watermark to every member, and opening the chat reads what it shows", async () => {
    const aliceSocket = await connect(alice);
    const message = await send(alice, "hello");

    const receipt = nextEvent(aliceSocket, "chat:receipt_updated", (p) => p.receipt.userId === String(bob.user.id) && p.receipt.readMessageId);
    await as(bob).get(`/chat/conversations/${conversationId}/messages`).expect(200);

    const { receipt: bobReceipt } = await receipt;
    expect(bobReceipt).toMatchObject({ readMessageId: message.id, deliveredMessageId: message.id });
  });

  it("the sender has read their own message, so it never counts against them", async () => {
    await send(bob, "from bob");
    expect(await unreadOf(alice)).toBe(1);

    const reply = await send(alice, "reply");
    expect(await unreadOf(alice)).toBe(0);
    expect(String((await receiptOf(alice.user.id)).readMessageId)).toBe(reply.id);
  });

  it("includes every member's receipt in the conversation payload", async () => {
    const message = await send(alice, "hi");
    await as(bob).patch(`/chat/conversations/${conversationId}/read`, {}).expect(200);

    const res = await as(alice).get("/chat/conversations").expect(200);
    const { receipts } = res.body.conversations.find((c) => c.id === conversationId);
    expect(receipts).toEqual(expect.arrayContaining([
      expect.objectContaining({ userId: String(bob.user.id), readMessageId: message.id }),
      expect.objectContaining({ userId: String(alice.user.id), readMessageId: message.id }),
    ]));
  });
});

describe("delivery receipts", () => {
  it("a socket ack marks delivery and notifies the sender", async () => {
    const [aliceSocket, bobSocket] = await Promise.all([connect(alice), connect(bob)]);
    const message = await send(alice, "ping");

    const delivered = nextEvent(aliceSocket, "chat:receipt_updated", (p) => p.receipt.userId === String(bob.user.id));
    await expect(ackDelivered(bobSocket, conversationId, message.id)).resolves.toEqual({ ok: true, advanced: true });

    const { receipt } = await delivered;
    expect(receipt).toMatchObject({ deliveredMessageId: message.id, readMessageId: null });
  });

  it("out-of-order, duplicate and concurrent acks settle on the newest message", async () => {
    const bobSocket = await connect(bob);
    const messages = [];
    for (let i = 0; i < 8; i += 1) messages.push(await send(alice, `d${i}`));
    const newest = messages[messages.length - 1];

    // Every ack at once, shuffled, plus duplicates of the newest.
    const shuffled = [...messages, newest, newest].sort(() => Math.random() - 0.5);
    await Promise.all(shuffled.map((m) => ackDelivered(bobSocket, conversationId, m.id)));
    expect(String((await receiptOf(bob.user.id)).deliveredMessageId)).toBe(newest.id);

    // A late ack for an old message changes nothing.
    await expect(ackDelivered(bobSocket, conversationId, messages[0].id)).resolves.toEqual({ ok: true, advanced: false });
    expect(String((await receiptOf(bob.user.id)).deliveredMessageId)).toBe(newest.id);
  });

  it("breaks ties between messages created in the same millisecond by id", async () => {
    const bobSocket = await connect(bob);
    const sameInstant = new Date();
    const [first, second] = await Message.insertMany([
      { conversationId, senderId: alice.user.id, text: "a", createdAt: sameInstant, updatedAt: sameInstant },
      { conversationId, senderId: alice.user.id, text: "b", createdAt: sameInstant, updatedAt: sameInstant },
    ]);
    const [low, high] = String(first._id) < String(second._id) ? [first, second] : [second, first];

    await ackDelivered(bobSocket, conversationId, String(high._id));
    await expect(ackDelivered(bobSocket, conversationId, String(low._id))).resolves.toMatchObject({ advanced: false });
    expect(String((await receiptOf(bob.user.id)).deliveredMessageId)).toBe(String(high._id));
  });

  it("ignores acks for messages of another conversation or from non-members", async () => {
    const [bobSocket, carolSocket] = await Promise.all([connect(bob), connect(carol)]);
    const carolChat = (await as(alice).post(`/chat/conversations/direct/${carol.user.id}`).expect(201)).body.conversation.id;
    const elsewhere = await send(alice, "to carol", carolChat);
    const here = await send(alice, "to bob");

    await expect(ackDelivered(bobSocket, conversationId, elsewhere.id)).resolves.toMatchObject({ advanced: false });
    await expect(ackDelivered(carolSocket, conversationId, here.id)).resolves.toMatchObject({ advanced: false });
    await expect(ackDelivered(bobSocket, "not-an-id", here.id)).resolves.toMatchObject({ advanced: false });
    expect((await receiptOf(carol.user.id)).deliveredMessageId).toBeFalsy();
  });

  it("loading the conversation list counts as delivery of each latest message", async () => {
    const aliceSocket = await connect(alice);
    const message = await send(alice, "while bob was away");

    const delivered = nextEvent(aliceSocket, "chat:receipt_updated", (p) => p.receipt.userId === String(bob.user.id));
    const res = await as(bob).get("/chat/conversations").expect(200);

    expect((await delivered).receipt.deliveredMessageId).toBe(message.id);
    const listed = res.body.conversations.find((c) => c.id === conversationId);
    expect(listed.receipts.find((r) => r.userId === String(bob.user.id)).deliveredMessageId).toBe(message.id);
    expect(listed.unread).toBe(1); // delivered is not read
  });
});
