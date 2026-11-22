import { beforeEach, describe, expect, it } from "vitest";

import { api, bearer, registerUser } from "../helpers/auth.js";

let alice;
let bob;

beforeEach(async () => {
  alice = await registerUser({ email: "alice@example.com", displayName: "Alice" });
  bob = await registerUser({ email: "bob@example.com", displayName: "Bob" });
});

const sendRequest = (from, to) =>
  api().post("/friends/requests").set(bearer(from.token)).send({ receiverId: to.user.id });

describe("friend requests", () => {
  it("full flow: send -> receiver sees it -> accept -> both are friends", async () => {
    const sent = await sendRequest(alice, bob).expect(201);
    const requestId = sent.body.request.requestId;

    const incoming = await api().get("/friends/requests").set(bearer(bob.token)).expect(200);
    expect(incoming.body.requests).toHaveLength(1);

    await api().post(`/friends/requests/${requestId}/accept`).set(bearer(bob.token)).expect(200);

    const aliceFriends = await api().get("/friends").set(bearer(alice.token)).expect(200);
    const bobFriends = await api().get("/friends").set(bearer(bob.token)).expect(200);
    expect(aliceFriends.body.friends).toHaveLength(1);
    expect(bobFriends.body.friends).toHaveLength(1);
  });

  it("cannot send a request to yourself", async () => {
    await sendRequest(alice, alice).expect(400);
  });

  it("cannot send a duplicate request in either direction", async () => {
    await sendRequest(alice, bob).expect(201);
    await sendRequest(alice, bob).expect(409);
    await sendRequest(bob, alice).expect(409);
  });

  it("only the receiver can accept", async () => {
    const sent = await sendRequest(alice, bob).expect(201);
    await api().post(`/friends/requests/${sent.body.request.requestId}/accept`).set(bearer(alice.token)).expect(404);
  });

  it("the sender can cancel and the receiver can decline", async () => {
    const first = await sendRequest(alice, bob).expect(201);
    await api().delete(`/friends/requests/${first.body.request.requestId}/cancel`).set(bearer(alice.token)).expect(200);

    const second = await sendRequest(alice, bob).expect(201);
    await api().delete(`/friends/requests/${second.body.request.requestId}`).set(bearer(bob.token)).expect(200);

    const incoming = await api().get("/friends/requests").set(bearer(bob.token)).expect(200);
    expect(incoming.body.requests).toHaveLength(0);
  });

  it("returns 400 (not 500) for a malformed receiverId", async () => {
    await api().post("/friends/requests").set(bearer(alice.token)).send({ receiverId: "not-an-id" }).expect(400);
  });

  it("returns 400 (not 500) for a malformed requestId", async () => {
    await api().post("/friends/requests/not-an-id/accept").set(bearer(bob.token)).expect(400);
  });
});
