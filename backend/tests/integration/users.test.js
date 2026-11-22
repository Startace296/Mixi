import { beforeEach, describe, expect, it } from "vitest";

import User from "../../src/models/User.js";
import { uploadUserAvatar } from "../../src/lib/image-upload.js";
import { api, bearer } from "../helpers/auth.js";
import { makeFriends, PNG, registerUsers, sendFriendRequest } from "../helpers/social.js";

let alice;
let bob;
let carol;
let dave;

beforeEach(async () => {
  ({ alice, bob, carol, dave } = await registerUsers("Alice", "Bob", "Carol", "Dave"));
});

const validProfile = {
  displayName: "Alice Nguyen",
  gender: "Female",
  dateOfBirth: "1995-06-15",
  bio: "Hello there",
  location: "Hanoi",
};

describe("GET /users/me and PATCH /users/me", () => {
  it("updates the profile", async () => {
    const res = await api().patch("/users/me").set(bearer(alice.token)).send(validProfile).expect(200);
    expect(res.body.user).toMatchObject({
      displayName: "Alice Nguyen",
      gender: "Female",
      bio: "Hello there",
      location: "Hanoi",
    });

    const me = await api().get("/users/me").set(bearer(alice.token)).expect(200);
    expect(me.body.user.displayName).toBe("Alice Nguyen");
    expect(me.body.user).not.toHaveProperty("passwordHash");
  });

  it("rejects invalid profiles", async () => {
    const patch = (body) => api().patch("/users/me").set(bearer(alice.token)).send({ ...validProfile, ...body });

    await patch({ displayName: "  " }).expect(400);
    await patch({ gender: "Robot" }).expect(400);
    await patch({ dateOfBirth: "not-a-date" }).expect(400);
    await patch({ bio: "1\n2\n3\n4\n5" }).expect(400);

    const tooYoung = new Date();
    tooYoung.setFullYear(tooYoung.getFullYear() - 17);
    const res = await patch({ dateOfBirth: tooYoung.toISOString().slice(0, 10) }).expect(400);
    expect(res.body.message).toMatch(/at least 18/);
  });
});

describe("POST /users/me/avatar", () => {
  it("uploads the avatar and stores its URL", async () => {
    const res = await api()
      .post("/users/me/avatar")
      .set(bearer(alice.token))
      .attach("avatar", PNG, { filename: "me.png", contentType: "image/png" })
      .expect(200);

    expect(uploadUserAvatar).toHaveBeenCalledWith(expect.any(Buffer), String(alice.user.id));
    expect(res.body.user.avatarUrl).toBe("https://cdn.test/avatars/image.jpg");
  });

  it("rejects a missing or non-image file", async () => {
    await api().post("/users/me/avatar").set(bearer(alice.token)).expect(400);
    await api()
      .post("/users/me/avatar")
      .set(bearer(alice.token))
      .attach("avatar", Buffer.from("GIF89a"), { filename: "a.gif", contentType: "image/gif" })
      .expect(400);
    expect(uploadUserAvatar).not.toHaveBeenCalled();
  });
});

describe("relationship status", () => {
  beforeEach(async () => {
    await makeFriends(alice, bob);
    await sendFriendRequest(alice, carol); // alice -> carol pending
    await sendFriendRequest(dave, alice); // dave -> alice pending
  });

  const statusOf = async (viewer, target) => {
    const res = await api().get(`/users/${target.user.id}`).set(bearer(viewer.token)).expect(200);
    return res.body.user.relationshipStatus;
  };

  it("is reported on profiles from the viewer's point of view", async () => {
    expect(await statusOf(alice, alice)).toBe("self");
    expect(await statusOf(alice, bob)).toBe("friends");
    expect(await statusOf(alice, carol)).toBe("requested");
    expect(await statusOf(carol, alice)).toBe("incoming");
    expect(await statusOf(alice, dave)).toBe("incoming");
    expect(await statusOf(bob, carol)).toBe("none");
  });

  it("returns friendRequestId for pending requests and relationshipId for friends", async () => {
    const pending = await api().get(`/users/${carol.user.id}`).set(bearer(alice.token)).expect(200);
    expect(pending.body.user.friendRequestId).toEqual(expect.any(String));
    expect(pending.body.user.relationshipId).toBeNull();

    const friend = await api().get(`/users/${bob.user.id}`).set(bearer(alice.token)).expect(200);
    expect(friend.body.user.relationshipId).toEqual(expect.any(String));
    expect(friend.body.user.friendRequestId).toBeNull();
  });

  it("is included in search results", async () => {
    const statusInSearch = async (name) => {
      const res = await api().get(`/users/search?q=${name}`).set(bearer(alice.token)).expect(200);
      return res.body.users.find((u) => u.displayName === name)?.relationshipStatus;
    };

    expect(await statusInSearch("Bob")).toBe("friends");
    expect(await statusInSearch("Carol")).toBe("requested");
    expect(await statusInSearch("Dave")).toBe("incoming");
  });
});

describe("GET /users/:userId", () => {
  it("returns 404 for unknown or unverified users and 400 for a malformed id", async () => {
    await api().get("/users/507f1f77bcf86cd799439011").set(bearer(alice.token)).expect(404);

    await User.updateOne({ _id: bob.user.id }, { isEmailVerified: false });
    await api().get(`/users/${bob.user.id}`).set(bearer(alice.token)).expect(404);

    await api().get("/users/not-an-id").set(bearer(alice.token)).expect(400);
  });
});

describe("GET /users/search", () => {
  const search = (user, q) => api().get(`/users/search?q=${encodeURIComponent(q)}`).set(bearer(user.token)).expect(200);

  it("returns nothing for an empty query", async () => {
    expect((await search(alice, "  ")).body.users).toEqual([]);
  });

  it("finds users by name, best match first, excluding the viewer", async () => {
    const res = await search(alice, "bob");
    expect(res.body.users[0].displayName).toBe("Bob");

    const self = await search(alice, "alice");
    expect(self.body.users.map((u) => u.displayName)).not.toContain("Alice");
  });

  it("does not return unverified users", async () => {
    await User.updateOne({ _id: bob.user.id }, { isEmailVerified: false });
    const res = await search(alice, "bob");
    expect(res.body.users.map((u) => u.displayName)).not.toContain("Bob");
  });

  it("respects the limit", async () => {
    const res = await api().get("/users/search?q=a&limit=1").set(bearer(dave.token)).expect(200);
    expect(res.body.users).toHaveLength(1);
  });
});
