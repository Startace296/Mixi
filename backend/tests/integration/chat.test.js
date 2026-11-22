import { beforeEach, describe, expect, it } from "vitest";

import Message from "../../src/models/Message.js";
import { generateGeminiJson } from "../../src/lib/gemini.js";
import { uploadChatImage, uploadGroupAvatar } from "../../src/lib/image-upload.js";
import { api, bearer } from "../helpers/auth.js";
import { makeFriends, PNG, registerUsers } from "../helpers/social.js";

let alice;
let bob;
let carol;
let dave; // not friends with anyone

beforeEach(async () => {
  ({ alice, bob, carol, dave } = await registerUsers("Alice", "Bob", "Carol", "Dave"));
  await makeFriends(alice, bob);
  await makeFriends(alice, carol);
});

const as = (user) => ({
  get: (url) => api().get(url).set(bearer(user.token)),
  post: (url, body) => api().post(url).set(bearer(user.token)).send(body),
  patch: (url, body) => api().patch(url).set(bearer(user.token)).send(body),
  delete: (url) => api().delete(url).set(bearer(user.token)),
});

async function openDirect(user, friend) {
  const res = await as(user).post(`/chat/conversations/direct/${friend.user.id}`).expect(201);
  return res.body.conversation.id;
}

async function send(user, conversationId, text) {
  const res = await as(user).post(`/chat/conversations/${conversationId}/messages`, { text }).expect(201);
  return res.body.message;
}

async function findConversation(user, conversationId) {
  const res = await as(user).get("/chat/conversations").expect(200);
  return res.body.conversations.find((conversation) => conversation.id === conversationId);
}

describe("direct conversations", () => {
  it("lists one direct conversation per friend, created automatically", async () => {
    const res = await as(alice).get("/chat/conversations").expect(200);
    expect(res.body.conversations.map((c) => c.name).sort()).toEqual(["Bob", "Carol"]);

    // Listing again must not create duplicates.
    const again = await as(alice).get("/chat/conversations").expect(200);
    expect(again.body.conversations).toHaveLength(2);
  });

  it("returns the same conversation from both sides, showing the other user", async () => {
    const fromAlice = await as(alice).post(`/chat/conversations/direct/${bob.user.id}`).expect(201);
    const fromBob = await as(bob).post(`/chat/conversations/direct/${alice.user.id}`).expect(201);

    expect(fromAlice.body.conversation.id).toBe(fromBob.body.conversation.id);
    expect(fromAlice.body.conversation.name).toBe("Bob");
    expect(fromBob.body.conversation.name).toBe("Alice");
    expect(fromAlice.body.conversation.friendId).toBe(String(bob.user.id));
    expect(fromAlice.body.conversation.presenceStatus).toBe("offline");
  });

  it("only allows messaging accepted friends", async () => {
    await as(alice).post(`/chat/conversations/direct/${dave.user.id}`).expect(403);
    await as(alice).post(`/chat/conversations/direct/${alice.user.id}`).expect(400);
    await as(alice).post("/chat/conversations/direct/not-an-id").expect(400);
  });
});

describe("messages", () => {
  let conversationId;

  beforeEach(async () => {
    conversationId = await openDirect(alice, bob);
  });

  it("sends a trimmed message and updates the conversation preview", async () => {
    const res = await as(alice).post(`/chat/conversations/${conversationId}/messages`, { text: "  hello  " }).expect(201);

    expect(res.body.message).toMatchObject({ text: "hello", type: "text", senderName: "Alice", isDeleted: false });
    expect(res.body.conversation.preview).toBe("hello");
    expect(res.body.conversation.lastMessageSenderId).toBe(String(alice.user.id));
  });

  it("validates message text", async () => {
    await as(alice).post(`/chat/conversations/${conversationId}/messages`, { text: "   " }).expect(400);
    await as(alice).post(`/chat/conversations/${conversationId}/messages`, { text: "x".repeat(4001) }).expect(400);
    await as(alice).post(`/chat/conversations/${conversationId}/messages`, { text: 42 }).expect(400);
    await as(alice).post(`/chat/conversations/${conversationId}/messages`, { imageUrl: "javascript:alert(1)" }).expect(400);
  });

  it("hides conversations from non-participants", async () => {
    await as(carol).post(`/chat/conversations/${conversationId}/messages`, { text: "hi" }).expect(404);
    await as(carol).get(`/chat/conversations/${conversationId}/messages`).expect(404);
    await as(alice).get("/chat/conversations/not-an-id/messages").expect(400);
  });

  it("counts unread messages for the receiver and clears them when read", async () => {
    await send(alice, conversationId, "one");
    await send(alice, conversationId, "two");

    expect((await findConversation(bob, conversationId)).unread).toBe(2);
    expect((await findConversation(alice, conversationId)).unread).toBe(0);

    const list = await as(bob).get(`/chat/conversations/${conversationId}/messages`).expect(200);
    expect(list.body.messages.map((m) => m.text)).toEqual(["one", "two"]);
    expect((await findConversation(bob, conversationId)).unread).toBe(0);
  });

  it("marks a conversation read explicitly", async () => {
    await send(alice, conversationId, "one");
    const res = await as(bob).patch(`/chat/conversations/${conversationId}/read`).expect(200);
    expect(res.body.conversation.unread).toBe(0);
  });

  it("pages messages from newest to oldest with a before cursor", async () => {
    for (const text of ["m1", "m2", "m3"]) await send(alice, conversationId, text);

    const page1 = await as(alice).get(`/chat/conversations/${conversationId}/messages?limit=2`).expect(200);
    expect(page1.body.messages.map((m) => m.text)).toEqual(["m2", "m3"]);
    expect(page1.body.pageInfo.hasMore).toBe(true);

    const before = encodeURIComponent(page1.body.pageInfo.nextBefore);
    const page2 = await as(alice).get(`/chat/conversations/${conversationId}/messages?limit=2&before=${before}`).expect(200);
    expect(page2.body.messages.map((m) => m.text)).toEqual(["m1"]);
    expect(page2.body.pageInfo.hasMore).toBe(false);

    await as(alice).get(`/chat/conversations/${conversationId}/messages?before=not-a-date`).expect(400);
  });

  it("never skips or repeats messages that share a timestamp across page boundaries", async () => {
    // 7 messages in the same millisecond: a createdAt-only cursor would lose some of them.
    const sameInstant = new Date("2025-03-01T10:00:00.000Z");
    await Message.insertMany(Array.from({ length: 7 }, (_, index) => ({
      conversationId,
      senderId: alice.user.id,
      text: `tie ${index}`,
      createdAt: sameInstant,
      updatedAt: sameInstant,
    })));

    const seen = [];
    let before = null;
    let pages = 0;
    do {
      const query = before ? `&before=${before}` : "";
      const res = await as(alice).get(`/chat/conversations/${conversationId}/messages?limit=3${query}`).expect(200);
      seen.unshift(...res.body.messages.map((m) => m.text));
      before = res.body.pageInfo.hasOlder ? res.body.pageInfo.startCursor : null;
      pages += 1;
    } while (before && pages < 10);

    expect(pages).toBe(3);
    expect(seen).toHaveLength(7);
    expect(new Set(seen).size).toBe(7);
  });

  it("fetches messages newer than an after cursor, for catching up", async () => {
    for (const text of ["a1", "a2", "a3", "a4", "a5"]) await send(alice, conversationId, text);

    const latest = await as(alice).get(`/chat/conversations/${conversationId}/messages?limit=2`).expect(200);
    expect(latest.body.pageInfo).toMatchObject({ hasOlder: true, hasNewer: false });
    const [first] = (await as(alice).get(`/chat/conversations/${conversationId}/messages?limit=5`)).body.messages;
    expect(first.text).toBe("a1");
    expect(first.cursor).toEqual(expect.any(String));

    const next = await as(alice).get(`/chat/conversations/${conversationId}/messages?limit=2&after=${first.cursor}`).expect(200);
    expect(next.body.messages.map((m) => m.text)).toEqual(["a2", "a3"]);
    expect(next.body.pageInfo).toMatchObject({ hasOlder: true, hasNewer: true });

    const rest = await as(alice).get(
      `/chat/conversations/${conversationId}/messages?limit=5&after=${next.body.pageInfo.endCursor}`,
    ).expect(200);
    expect(rest.body.messages.map((m) => m.text)).toEqual(["a4", "a5"]);
    expect(rest.body.pageInfo.hasNewer).toBe(false);

    const caughtUp = await as(alice).get(
      `/chat/conversations/${conversationId}/messages?after=${rest.body.pageInfo.endCursor}`,
    ).expect(200);
    expect(caughtUp.body.messages).toEqual([]);
    expect(caughtUp.body.pageInfo).toMatchObject({ hasNewer: false, startCursor: null, endCursor: null });
  });

  it("rejects malformed cursors and asking for both directions at once", async () => {
    const url = `/chat/conversations/${conversationId}/messages`;
    const message = await send(alice, conversationId, "x");

    await as(alice).get(`${url}?after=not-a-cursor`).expect(400);
    await as(alice).get(`${url}?after=${encodeURIComponent(new Date().toISOString())}`).expect(400);
    await as(alice).get(`${url}?before=${message.cursor}&after=${message.cursor}`).expect(400);
  });

  it("still accepts the legacy ISO-date before cursor", async () => {
    for (const text of ["old", "new"]) await send(alice, conversationId, text);
    const [, newest] = (await as(alice).get(`/chat/conversations/${conversationId}/messages`)).body.messages;

    const res = await as(alice).get(
      `/chat/conversations/${conversationId}/messages?before=${encodeURIComponent(newest.createdAt)}`,
    ).expect(200);
    expect(res.body.messages.map((m) => m.text)).toEqual(["old"]);
  });

  it("only marks the conversation read when the page reaches the newest messages", async () => {
    for (const text of ["r1", "r2", "r3"]) await send(alice, conversationId, text);
    const [oldest, middle] = (await as(alice).get(`/chat/conversations/${conversationId}/messages`)).body.messages;

    // Browsing history (before) or a partial catch-up (after, more remaining) keeps it unread.
    await as(bob).get(`/chat/conversations/${conversationId}/messages?before=${middle.cursor}`).expect(200);
    await as(bob).get(`/chat/conversations/${conversationId}/messages?limit=1&after=${oldest.cursor}`).expect(200);
    expect((await findConversation(bob, conversationId)).unread).toBe(3);

    await as(bob).get(`/chat/conversations/${conversationId}/messages?after=${oldest.cursor}`).expect(200);
    expect((await findConversation(bob, conversationId)).unread).toBe(0);
  });

  it("reports messages deleted since an earlier serverTime, for clients that missed the events", async () => {
    const kept = await send(alice, conversationId, "kept");
    const gone = await send(alice, conversationId, "gone");
    const url = `/chat/conversations/${conversationId}/messages`;

    const first = await as(bob).get(url).expect(200);
    expect(first.body.serverTime).toEqual(expect.any(String));
    expect(first.body.deletedMessageIds).toBeUndefined();

    await as(alice).delete(`/chat/messages/${gone.id}`).expect(200);

    const since = encodeURIComponent(first.body.serverTime);
    const sync = await as(bob).get(`${url}?after=${gone.cursor}&deletedSince=${since}`).expect(200);
    expect(sync.body.messages).toEqual([]);
    expect(sync.body.deletedMessageIds).toEqual([gone.id]);
    expect(sync.body.deletedMessageIds).not.toContain(kept.id);
    expect(sync.body.deletedTruncated).toBe(false);

    // Nothing deleted after the latest serverTime (beyond the clock-skew window).
    const later = new Date(Date.parse(sync.body.serverTime) + 60_000).toISOString();
    const none = await as(bob).get(`${url}?deletedSince=${encodeURIComponent(later)}`).expect(200);
    expect(none.body.deletedMessageIds).toEqual([]);

    await as(bob).get(`${url}?deletedSince=yesterday`).expect(400);
  });

  it("serves every page direction from the timeline index without an in-memory sort", async () => {
    await Message.syncIndexes();
    const cursor = { createdAt: new Date(), id: new Message()._id };
    const { buildKeysetFilter } = await import("../../src/utils/pagination.utils.js");

    for (const [direction, order] of [[null, -1], ["before", -1], ["after", 1]]) {
      const filter = {
        conversationId: new Message()._id,
        ...(direction && { $and: [buildKeysetFilter(cursor, direction)] }),
      };
      const plan = await Message.find(filter)
        .sort({ createdAt: order, _id: order })
        .limit(51)
        .explain("queryPlanner");
      const winningPlan = JSON.stringify(plan.queryPlanner?.winningPlan ?? plan[0]?.queryPlanner?.winningPlan);

      expect(winningPlan).toContain("conversation_timeline");
      expect(winningPlan).not.toContain('"stage":"SORT"');
    }

    const deletedPlan = await Message.find({
      conversationId: new Message()._id,
      deletedAt: { $type: "date", $gt: new Date(0) },
    }).select("_id").explain("queryPlanner");
    expect(JSON.stringify(deletedPlan)).toContain("conversation_deleted");
  });

  it("lets only the sender delete a message, leaving a placeholder", async () => {
    const message = await send(alice, conversationId, "secret");

    await as(bob).delete(`/chat/messages/${message.id}`).expect(403);
    const res = await as(alice).delete(`/chat/messages/${message.id}`).expect(200);

    expect(res.body.message).toMatchObject({ isDeleted: true, text: "" });
    expect((await findConversation(bob, conversationId)).preview).toBe("This message was deleted");
  });

  it("hiding a conversation removes it and its old messages until new activity", async () => {
    await send(bob, conversationId, "old");
    await as(alice).patch(`/chat/conversations/${conversationId}/hide`).expect(200);

    expect(await findConversation(alice, conversationId)).toBeUndefined();

    await send(bob, conversationId, "new");
    expect(await findConversation(alice, conversationId)).toBeDefined();

    const list = await as(alice).get(`/chat/conversations/${conversationId}/messages`).expect(200);
    expect(list.body.messages.map((m) => m.text)).toEqual(["new"]);
  });

  it("sends an image message using the uploaded URL", async () => {
    const res = await api()
      .post(`/chat/conversations/${conversationId}/images`)
      .set(bearer(alice.token))
      .attach("image", PNG, { filename: "photo.png", contentType: "image/png" })
      .expect(201);

    expect(uploadChatImage).toHaveBeenCalledOnce();
    expect(res.body.message).toMatchObject({ type: "image", imageUrl: "https://cdn.test/messages/image.jpg" });
    expect(res.body.conversation.preview).toBe("Image");
  });

  describe("idempotent retries (clientMessageId)", () => {
    const url = () => `/chat/conversations/${conversationId}/messages`;

    it("a retry of a send that already succeeded returns the same message, once", async () => {
      const body = { text: "only once", clientMessageId: "retry-key-0001" };
      const first = await as(alice).post(url(), body).expect(201);
      const retry = await as(alice).post(url(), body).expect(200);

      expect(retry.body.message.id).toBe(first.body.message.id);
      expect(first.body.message.clientMessageId).toBe("retry-key-0001");
      expect(await Message.countDocuments({ conversationId })).toBe(1);
      expect((await findConversation(bob, conversationId)).unread).toBe(1);
    });

    it("concurrent attempts with one key store exactly one message", async () => {
      const body = { text: "flaky network", clientMessageId: "retry-key-race" };
      const responses = await Promise.all(Array.from({ length: 10 }, () => as(alice).post(url(), body)));

      expect(responses.map((res) => res.status).sort()).toEqual([200, 200, 200, 200, 200, 200, 200, 200, 200, 201]);
      expect(new Set(responses.map((res) => res.body.message.id)).size).toBe(1);
      expect(await Message.countDocuments({ conversationId })).toBe(1);
      expect((await findConversation(bob, conversationId)).unread).toBe(1);
    });

    it("keys are per sender, and a key cannot be reused in another conversation", async () => {
      await as(alice).post(url(), { text: "a", clientMessageId: "shared-key-01" }).expect(201);
      await as(bob).post(url(), { text: "b", clientMessageId: "shared-key-01" }).expect(201);
      expect(await Message.countDocuments({ conversationId })).toBe(2);

      const other = await openDirect(alice, carol);
      await as(alice).post(`/chat/conversations/${other}/messages`, { text: "c", clientMessageId: "shared-key-01" }).expect(409);
      await as(alice).post(url(), { text: "d", clientMessageId: "bad key!" }).expect(400);
    });

    it("retrying an image upload that went through does not upload it again", async () => {
      const upload = () => api()
        .post(`/chat/conversations/${conversationId}/images`)
        .set(bearer(alice.token))
        .field("clientMessageId", "image-retry-01")
        .attach("image", PNG, { filename: "photo.png", contentType: "image/png" });

      const first = await upload().expect(201);
      const retry = await upload().expect(200);

      expect(retry.body.message.id).toBe(first.body.message.id);
      expect(uploadChatImage).toHaveBeenCalledOnce();
    });
  });

  it("rejects image messages without a file or with a non-image file", async () => {
    await api().post(`/chat/conversations/${conversationId}/images`).set(bearer(alice.token)).expect(400);
    await api()
      .post(`/chat/conversations/${conversationId}/images`)
      .set(bearer(alice.token))
      .attach("image", Buffer.from("GIF89a"), { filename: "a.gif", contentType: "image/gif" })
      .expect(400);
    expect(uploadChatImage).not.toHaveBeenCalled();
  });
});

describe("group conversations", () => {
  async function createGroup(owner = alice, members = [bob]) {
    const res = await as(owner)
      .post("/chat/conversations/group", { name: "Team", memberIds: members.map((m) => m.user.id) })
      .expect(201);
    return res.body.conversation;
  }

  it("creates a group with friends; the creator is the owner", async () => {
    const group = await createGroup(alice, [bob, carol]);

    expect(group).toMatchObject({ type: "group", name: "Team", memberCount: 3, ownerId: String(alice.user.id) });
    expect(await findConversation(bob, group.id)).toBeDefined();
  });

  it("accepts memberIds as a comma-separated string and uploads an avatar (multipart)", async () => {
    const res = await api()
      .post("/chat/conversations/group")
      .set(bearer(alice.token))
      .field("name", "Photo team")
      .field("memberIds", `${bob.user.id},${carol.user.id}`)
      .attach("avatar", PNG, { filename: "g.png", contentType: "image/png" })
      .expect(201);

    expect(uploadGroupAvatar).toHaveBeenCalledOnce();
    expect(res.body.conversation).toMatchObject({
      memberCount: 3,
      avatarUrl: "https://cdn.test/group-avatars/image.jpg",
    });
  });

  it("validates the group name and members", async () => {
    await as(alice).post("/chat/conversations/group", { name: "  " }).expect(400);
    await as(alice).post("/chat/conversations/group", { name: "x".repeat(81) }).expect(400);
    await as(alice).post("/chat/conversations/group", { name: "Team", memberIds: [dave.user.id] }).expect(403);
    await as(alice).post("/chat/conversations/group", { name: "Team", memberIds: ["bad-id"] }).expect(400);
  });

  it("only the owner can rename the group", async () => {
    const group = await createGroup();

    await as(bob).patch(`/chat/conversations/${group.id}/group`, { name: "Hacked" }).expect(403);
    const res = await as(alice).patch(`/chat/conversations/${group.id}/group`, { name: " Renamed " }).expect(200);
    expect(res.body.conversation.name).toBe("Renamed");
  });

  it("rejects a malformed memberId", async () => {
    const group = await createGroup();
    await as(alice).post(`/chat/conversations/${group.id}/members`, {}).expect(400);
    await as(alice).post(`/chat/conversations/${group.id}/members`, { memberId: "bad-id" }).expect(400);
  });

  it("adds a friend as member once", async () => {
    const group = await createGroup();

    const res = await as(alice).post(`/chat/conversations/${group.id}/members`, { memberId: carol.user.id }).expect(201);
    expect(res.body.conversation.memberCount).toBe(3);

    await as(alice).post(`/chat/conversations/${group.id}/members`, { memberId: carol.user.id }).expect(409);
    await as(alice).post(`/chat/conversations/${group.id}/members`, { memberId: dave.user.id }).expect(403);
  });

  it("lets the owner remove a member, who then loses access", async () => {
    const group = await createGroup(alice, [bob, carol]);

    await as(bob).delete(`/chat/conversations/${group.id}/members/${carol.user.id}`).expect(403);
    await as(alice).delete(`/chat/conversations/${group.id}/members/${alice.user.id}`).expect(400);
    await as(alice).delete(`/chat/conversations/${group.id}/members/${dave.user.id}`).expect(404);

    const res = await as(alice).delete(`/chat/conversations/${group.id}/members/${carol.user.id}`).expect(200);
    expect(res.body.conversation.memberCount).toBe(2);
    await as(carol).get(`/chat/conversations/${group.id}/messages`).expect(404);
  });

  it("members can leave, the owner cannot", async () => {
    const group = await createGroup();

    await as(alice).post(`/chat/conversations/${group.id}/leave`).expect(400);
    const res = await as(bob).post(`/chat/conversations/${group.id}/leave`).expect(200);
    expect(res.body.conversationId).toBe(group.id);

    await as(bob).get(`/chat/conversations/${group.id}/messages`).expect(404);
    expect(await findConversation(bob, group.id)).toBeUndefined();
  });

  it("only the owner can delete the group, which also deletes its messages", async () => {
    const group = await createGroup();
    await send(bob, group.id, "hi team");

    await as(bob).delete(`/chat/conversations/${group.id}`).expect(403);
    await as(alice).delete(`/chat/conversations/${group.id}`).expect(200);

    expect(await Message.countDocuments({ conversationId: group.id })).toBe(0);
    await as(alice).get(`/chat/conversations/${group.id}/messages`).expect(404);
  });

  it("direct conversations cannot be managed as groups", async () => {
    const conversationId = await openDirect(alice, bob);
    await as(alice).patch(`/chat/conversations/${conversationId}/group`, { name: "x" }).expect(404);
  });
});

describe("AI features", () => {
  let conversationId;
  let lastMessage;

  beforeEach(async () => {
    conversationId = await openDirect(alice, bob);
    await send(alice, conversationId, "are we meeting tomorrow?");
    lastMessage = await send(bob, conversationId, "yes, at 9am");
  });

  const summarize = (user, body) => as(user).post(`/chat/conversations/${conversationId}/ai/summarize`, body);
  const suggest = (user, body) => as(user).post(`/chat/conversations/${conversationId}/ai/suggest-replies`, body);

  it("summarizes the transcript, labelling the viewer as 'bạn'", async () => {
    generateGeminiJson.mockResolvedValueOnce({ bullets: ["Meeting at 9am", "", 42] });

    const res = await summarize(alice, { endMessageId: lastMessage.id }).expect(200);

    expect(res.body.summaryBullets).toEqual(["Meeting at 9am"]);
    expect(res.body.meta.messageCount).toBe(2);

    const { user: prompt } = generateGeminiJson.mock.calls[0][0];
    expect(prompt).toContain("bạn: are we meeting tomorrow?");
    expect(prompt).toMatch(/Bob \(#\w{6}\): yes, at 9am/);
  });

  it("fails with 500 when the AI returns no bullets", async () => {
    generateGeminiJson.mockResolvedValueOnce({ bullets: [] });
    await summarize(alice, { endMessageId: lastMessage.id }).expect(500);
  });

  it("validates the request before calling the AI", async () => {
    await summarize(alice, {}).expect(400);
    await summarize(alice, { endMessageId: "bad-id" }).expect(400);
    await summarize(alice, { endMessageId: lastMessage.id, startMessageId: "bad-id" }).expect(400);
    await summarize(alice, { endMessageId: lastMessage.id, maxMessages: 51 }).expect(400);
    await suggest(alice, { endMessageId: lastMessage.id, maxMessages: "abc" }).expect(400);
    await summarize(carol, { endMessageId: lastMessage.id }).expect(404);
    expect(generateGeminiJson).not.toHaveBeenCalled();
  });

  it("always returns 3 clean reply suggestions", async () => {
    generateGeminiJson.mockResolvedValueOnce({ replies: ["  See you then!  ", "See you then!", "fuck off"] });

    const res = await suggest(alice, { endMessageId: lastMessage.id }).expect(200);

    expect(res.body.replies).toHaveLength(3);
    expect(res.body.replies[0]).toBe("See you then!");
    expect(res.body.replies.join(" ")).not.toMatch(/fuck/i);
    expect(res.body.meta.styleSampleCount).toBe(1);
  });
});
