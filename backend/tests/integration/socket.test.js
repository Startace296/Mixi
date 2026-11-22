import http from "node:http";

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { io as connectClient } from "socket.io-client";

import app from "../../src/app.js";
import { initSocket } from "../../src/socket.js";
import { api, bearer } from "../helpers/auth.js";
import { makeFriends, registerUsers } from "../helpers/social.js";

// A real HTTP server with Socket.IO attached, listening on a random free port.
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

function newClient(token) {
  const client = connectClient(baseUrl, {
    auth: { token },
    transports: ["websocket"],
    forceNew: true,
    reconnection: false,
  });
  openClients.add(client);
  return client;
}

/** Connects a socket as the given user and resolves once the handshake is accepted. */
function connect(user) {
  const client = newClient(user.token);
  return new Promise((resolve, reject) => {
    client.once("connect", () => resolve(client));
    client.once("connect_error", reject);
  });
}

/** Resolves with the first `event` payload that matches `predicate`; rejects after `timeoutMs`. */
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

/** Collects every `event` payload during `windowMs`, to assert that nothing (relevant) arrived. */
async function eventsDuring(client, event, windowMs = 400) {
  const received = [];
  const handler = (payload) => received.push(payload);
  client.on(event, handler);
  await new Promise((resolve) => setTimeout(resolve, windowMs));
  client.off(event, handler);
  return received;
}

const presenceOf = (user, status) => (payload) =>
  payload.userId === String(user.user.id) && (!status || payload.status === status);

let alice;
let bob;
let carol;
let dave; // not friends with anyone
let directId; // alice <-> bob

beforeEach(async () => {
  ({ alice, bob, carol, dave } = await registerUsers("Alice", "Bob", "Carol", "Dave"));
  await makeFriends(alice, bob);
  await makeFriends(alice, carol);
  const res = await api()
    .post(`/chat/conversations/direct/${bob.user.id}`)
    .set(bearer(alice.token))
    .expect(201);
  directId = res.body.conversation.id;
});

async function sendText(user, conversationId, text) {
  const res = await api()
    .post(`/chat/conversations/${conversationId}/messages`)
    .set(bearer(user.token))
    .send({ text })
    .expect(201);
  return res.body.message;
}

describe("authentication", () => {
  it("rejects a connection without a token", async () => {
    const client = newClient("");
    const error = await new Promise((resolve) => client.once("connect_error", resolve));
    expect(error.message).toBe("Unauthorized");
    expect(client.connected).toBe(false);
  });

  it("rejects a connection with an invalid token", async () => {
    const client = newClient("not-a-jwt");
    const error = await new Promise((resolve) => client.once("connect_error", resolve));
    expect(error.message).toBe("Unauthorized");
  });

  it("accepts a connection with a valid access token", async () => {
    const client = await connect(alice);
    expect(client.connected).toBe(true);
  });
});

describe("realtime messages between two clients", () => {
  it("delivers a message sent by one user to the other user's socket", async () => {
    const [aliceSocket, bobSocket] = await Promise.all([connect(alice), connect(bob)]);

    const bobReceives = nextEvent(bobSocket, "chat:message_created");
    const aliceReceives = nextEvent(aliceSocket, "chat:message_created");
    const sent = await sendText(alice, directId, "  hello bob  ");

    const toBob = await bobReceives;
    expect(toBob.conversationId).toBe(directId);
    expect(toBob.message).toMatchObject({ id: sent.id, text: "hello bob" });
    expect(String(toBob.message.senderId)).toBe(String(alice.user.id));
    // Each participant gets the conversation from their own point of view.
    expect(toBob.conversation).toMatchObject({ id: directId, name: "Alice", unread: 1, preview: "hello bob" });

    const toAlice = await aliceReceives;
    expect(toAlice.message.id).toBe(sent.id);
    expect(toAlice.conversation).toMatchObject({ name: "Bob", unread: 0 });
  });

  it("works in both directions", async () => {
    const [aliceSocket, bobSocket] = await Promise.all([connect(alice), connect(bob)]);

    const aliceReceives = nextEvent(aliceSocket, "chat:message_created", (p) => p.message.text === "hi alice");
    await sendText(bob, directId, "hi alice");
    await aliceReceives;

    const bobReceives = nextEvent(bobSocket, "chat:message_created", (p) => p.message.text === "hey bob");
    await sendText(alice, directId, "hey bob");
    await bobReceives;
  });

  it("delivers to every open tab of the receiver", async () => {
    const [bobTab1, bobTab2] = await Promise.all([connect(bob), connect(bob)]);

    const received = Promise.all([
      nextEvent(bobTab1, "chat:message_created"),
      nextEvent(bobTab2, "chat:message_created"),
    ]);
    await sendText(alice, directId, "to all tabs");

    const [first, second] = await received;
    expect(first.message.text).toBe("to all tabs");
    expect(second.message.text).toBe("to all tabs");
  });

  it("does not leak messages to users outside the conversation", async () => {
    const [carolSocket, daveSocket] = await Promise.all([connect(carol), connect(dave)]);

    const carolEvents = eventsDuring(carolSocket, "chat:message_created");
    const daveEvents = eventsDuring(daveSocket, "chat:message_created");
    await sendText(alice, directId, "private");

    expect(await carolEvents).toEqual([]);
    expect(await daveEvents).toEqual([]);
  });

  it("broadcasts a deleted message to both participants", async () => {
    const [aliceSocket, bobSocket] = await Promise.all([connect(alice), connect(bob)]);
    const sent = await sendText(alice, directId, "oops");

    const received = Promise.all([
      nextEvent(aliceSocket, "chat:message_deleted"),
      nextEvent(bobSocket, "chat:message_deleted"),
    ]);
    await api().delete(`/chat/messages/${sent.id}`).set(bearer(alice.token)).expect(200);

    for (const payload of await received) {
      expect(payload.message).toMatchObject({ id: sent.id, isDeleted: true, text: "" });
    }
  });

  it("notifies the sender when the receiver reads the conversation", async () => {
    const aliceSocket = await connect(alice);
    await sendText(alice, directId, "did you read this?");

    const aliceReceives = nextEvent(aliceSocket, "chat:conversation_read");
    await api().patch(`/chat/conversations/${directId}/read`).set(bearer(bob.token)).expect(200);

    const payload = await aliceReceives;
    expect(payload).toMatchObject({ conversationId: directId, userId: String(bob.user.id) });
  });

  it("delivers group messages to every member", async () => {
    const [bobSocket, carolSocket, daveSocket] = await Promise.all([connect(bob), connect(carol), connect(dave)]);
    const groupRes = await api()
      .post("/chat/conversations/group")
      .set(bearer(alice.token))
      .send({ name: "Team", memberIds: [bob.user.id, carol.user.id] })
      .expect(201);
    const groupId = groupRes.body.conversation.id;

    const received = Promise.all([
      nextEvent(bobSocket, "chat:message_created", (p) => p.conversationId === groupId),
      nextEvent(carolSocket, "chat:message_created", (p) => p.conversationId === groupId),
    ]);
    const daveEvents = eventsDuring(daveSocket, "chat:message_created");
    await sendText(alice, groupId, "hello team");

    for (const payload of await received) {
      expect(payload.message.text).toBe("hello team");
      expect(payload.conversation).toMatchObject({ type: "group", name: "Team", unread: 1 });
    }
    expect(await daveEvents).toEqual([]);
  });

  it("tells a removed group member that the conversation is gone", async () => {
    const carolSocket = await connect(carol);
    const groupRes = await api()
      .post("/chat/conversations/group")
      .set(bearer(alice.token))
      .send({ name: "Team", memberIds: [bob.user.id, carol.user.id] })
      .expect(201);
    const groupId = groupRes.body.conversation.id;

    const carolRemoved = nextEvent(carolSocket, "chat:conversation_removed", (p) => p.conversationId === groupId);
    await api()
      .delete(`/chat/conversations/${groupId}/members/${carol.user.id}`)
      .set(bearer(alice.token))
      .expect(200);
    await carolRemoved;

    // And she no longer receives the group's messages.
    const carolEvents = eventsDuring(carolSocket, "chat:message_created");
    await sendText(alice, groupId, "after carol left");
    expect(await carolEvents).toEqual([]);
  });
});

describe("typing indicator", () => {
  it("relays typing start/stop to the other participant only", async () => {
    const [aliceSocket, bobSocket] = await Promise.all([connect(alice), connect(bob)]);

    const aliceEcho = eventsDuring(aliceSocket, "chat:typing");
    const bobStarts = nextEvent(bobSocket, "chat:typing", (p) => p.isTyping === true);
    aliceSocket.emit("chat:typing", { conversationId: directId, isTyping: true });

    expect(await bobStarts).toMatchObject({
      conversationId: directId,
      userId: String(alice.user.id),
      isTyping: true,
    });

    const bobStops = nextEvent(bobSocket, "chat:typing", (p) => p.isTyping === false);
    aliceSocket.emit("chat:typing", { conversationId: directId, isTyping: false });
    expect(await bobStops).toMatchObject({ userId: String(alice.user.id), isTyping: false });

    // The typer never gets their own indicator back.
    expect(await aliceEcho).toEqual([]);
  });

  it("is ignored when the sender is not a participant", async () => {
    const [bobSocket, daveSocket] = await Promise.all([connect(bob), connect(dave)]);

    const bobEvents = eventsDuring(bobSocket, "chat:typing");
    daveSocket.emit("chat:typing", { conversationId: directId, isTyping: true });

    expect(await bobEvents).toEqual([]);
  });

  it("ignores malformed conversation ids without crashing the socket", async () => {
    const [aliceSocket, bobSocket] = await Promise.all([connect(alice), connect(bob)]);

    const bobEvents = eventsDuring(bobSocket, "chat:typing");
    aliceSocket.emit("chat:typing", { conversationId: "not-an-id", isTyping: true });
    aliceSocket.emit("chat:typing", {});
    expect(await bobEvents).toEqual([]);

    // The socket still works afterwards.
    const bobStarts = nextEvent(bobSocket, "chat:typing");
    aliceSocket.emit("chat:typing", { conversationId: directId, isTyping: true });
    await bobStarts;
    expect(aliceSocket.connected).toBe(true);
  });

  it("relays typing in a group to all other members", async () => {
    const [aliceSocket, bobSocket, carolSocket] = await Promise.all([connect(alice), connect(bob), connect(carol)]);
    const groupRes = await api()
      .post("/chat/conversations/group")
      .set(bearer(alice.token))
      .send({ name: "Team", memberIds: [bob.user.id, carol.user.id] })
      .expect(201);
    const groupId = groupRes.body.conversation.id;

    const received = Promise.all([
      nextEvent(aliceSocket, "chat:typing", (p) => p.conversationId === groupId),
      nextEvent(carolSocket, "chat:typing", (p) => p.conversationId === groupId),
    ]);
    bobSocket.emit("chat:typing", { conversationId: groupId, isTyping: true });

    for (const payload of await received) {
      expect(payload).toMatchObject({ userId: String(bob.user.id), isTyping: true });
    }
  });
});

describe("presence", () => {
  it("announces a user as online when they connect", async () => {
    const aliceSocket = await connect(alice);

    const bobOnline = nextEvent(aliceSocket, "presence:changed", presenceOf(bob, "online"));
    await connect(bob);

    const payload = await bobOnline;
    expect(payload.lastActiveAt).toBeTruthy();
  });

  it("switches between away and online with presence:set", async () => {
    const [aliceSocket, bobSocket] = await Promise.all([connect(alice), connect(bob)]);

    const bobAway = nextEvent(aliceSocket, "presence:changed", presenceOf(bob, "away"));
    bobSocket.emit("presence:set", { status: "away" });
    await bobAway;

    const bobBack = nextEvent(aliceSocket, "presence:changed", presenceOf(bob, "online"));
    bobSocket.emit("presence:set", { status: "online" });
    await bobBack;
  });

  it("treats unknown statuses as online", async () => {
    const [aliceSocket, bobSocket] = await Promise.all([connect(alice), connect(bob)]);
    bobSocket.emit("presence:set", { status: "away" });
    await nextEvent(aliceSocket, "presence:changed", presenceOf(bob, "away"));

    const bobOnline = nextEvent(aliceSocket, "presence:changed", presenceOf(bob, "online"));
    bobSocket.emit("presence:set", { status: "invisible" });
    await bobOnline;
  });

  it("announces a user as offline when their last socket disconnects", async () => {
    const [aliceSocket, bobSocket] = await Promise.all([connect(alice), connect(bob)]);

    const bobOffline = nextEvent(aliceSocket, "presence:changed", presenceOf(bob, "offline"));
    bobSocket.disconnect();

    const payload = await bobOffline;
    expect(payload.lastActiveAt).toBeTruthy();
  });

  it("stays online while another tab is still connected, and online beats away", async () => {
    const aliceSocket = await connect(alice);
    const [bobTab1, bobTab2] = await Promise.all([connect(bob), connect(bob)]);

    // One tab away, the other online -> still online.
    const stillOnline = nextEvent(aliceSocket, "presence:changed", presenceOf(bob));
    bobTab1.emit("presence:set", { status: "away" });
    expect((await stillOnline).status).toBe("online");

    // Closing the online tab leaves only the away tab.
    const nowAway = nextEvent(aliceSocket, "presence:changed", presenceOf(bob));
    bobTab2.disconnect();
    expect((await nowAway).status).toBe("away");

    const nowOffline = nextEvent(aliceSocket, "presence:changed", presenceOf(bob));
    bobTab1.disconnect();
    expect((await nowOffline).status).toBe("offline");
  });

  it("exposes the friend's presence in the conversation list", async () => {
    const findBob = async () => {
      const res = await api().get("/chat/conversations").set(bearer(alice.token)).expect(200);
      return res.body.conversations.find((c) => c.id === directId);
    };

    expect((await findBob()).presenceStatus).toBe("offline");

    // Alice's socket is only used to know when the server has applied each change.
    const aliceSocket = await connect(alice);

    const bobSocket = await connect(bob);
    expect((await findBob()).presenceStatus).toBe("online");

    const bobAway = nextEvent(aliceSocket, "presence:changed", presenceOf(bob, "away"));
    bobSocket.emit("presence:set", { status: "away" });
    await bobAway;
    expect((await findBob()).presenceStatus).toBe("away");

    const bobOffline = nextEvent(aliceSocket, "presence:changed", presenceOf(bob, "offline"));
    bobSocket.disconnect();
    await bobOffline;
    expect((await findBob()).presenceStatus).toBe("offline");
  });
});
