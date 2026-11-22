import { api, bearer, registerUser } from "./auth.js";

/** A tiny valid-looking PNG payload: uploads are mocked, only the mimetype matters. */
export const PNG = Buffer.from("89504e470d0a1a0a", "hex");

/** Registers users with the given display names, keyed by lowercase name. */
export async function registerUsers(...names) {
  const users = {};
  for (const name of names) {
    users[name.toLowerCase()] = await registerUser({
      email: `${name.toLowerCase()}@example.com`,
      displayName: name,
    });
  }
  return users;
}

export async function sendFriendRequest(from, to) {
  const res = await api()
    .post("/friends/requests")
    .set(bearer(from.token))
    .send({ receiverId: to.user.id })
    .expect(201);
  return res.body.request.requestId;
}

export async function makeFriends(left, right) {
  const requestId = await sendFriendRequest(left, right);
  await api().post(`/friends/requests/${requestId}/accept`).set(bearer(right.token)).expect(200);
}
