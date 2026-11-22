import { beforeEach, describe, expect, it } from "vitest";

import { uploadPostImage } from "../../src/lib/image-upload.js";
import { api, bearer } from "../helpers/auth.js";
import { makeFriends, PNG, registerUsers } from "../helpers/social.js";

let alice;
let bob;
let dave; // not friends with anyone

beforeEach(async () => {
  ({ alice, bob, dave } = await registerUsers("Alice", "Bob", "Dave"));
  await makeFriends(alice, bob);
});

const as = (user) => ({
  get: (url) => api().get(url).set(bearer(user.token)),
  post: (url, body) => api().post(url).set(bearer(user.token)).send(body),
  patch: (url, body) => api().patch(url).set(bearer(user.token)).send(body),
  delete: (url) => api().delete(url).set(bearer(user.token)),
});

async function createPost(user, caption = "hello") {
  const res = await as(user).post("/posts", { caption }).expect(201);
  return res.body.post;
}

async function addComment(user, postId, text = "nice") {
  const res = await as(user).post(`/posts/${postId}/comments`, { text }).expect(201);
  return res.body.comment;
}

async function getFeedPost(user, postId) {
  const res = await as(user).get("/posts").expect(200);
  return res.body.posts.find((post) => post.id === postId);
}

describe("creating and editing posts", () => {
  it("creates a text post with a trimmed caption", async () => {
    const res = await as(alice).post("/posts", { caption: "  hello world  " }).expect(201);

    expect(res.body.post).toMatchObject({
      caption: "hello world",
      authorName: "Alice",
      isOwn: true,
      likeCount: 0,
      comments: [],
    });
  });

  it("creates an image-only post", async () => {
    const res = await api()
      .post("/posts")
      .set(bearer(alice.token))
      .attach("image", PNG, { filename: "p.png", contentType: "image/png" })
      .expect(201);

    expect(uploadPostImage).toHaveBeenCalledOnce();
    expect(res.body.post).toMatchObject({ caption: "", imageUrl: "https://cdn.test/posts/image.jpg" });
  });

  it("requires text or an image, and limits caption length", async () => {
    await as(alice).post("/posts", { caption: "   " }).expect(400);
    await as(alice).post("/posts", { caption: "x".repeat(4001) }).expect(400);
  });

  it("only the author can edit or delete a post", async () => {
    const post = await createPost(alice);

    await as(bob).patch(`/posts/${post.id}`, { caption: "hacked" }).expect(403);
    await as(bob).delete(`/posts/${post.id}`).expect(403);

    const res = await as(alice).patch(`/posts/${post.id}`, { caption: " edited " }).expect(200);
    expect(res.body.post.caption).toBe("edited");

    await as(alice).delete(`/posts/${post.id}`).expect(200);
    await as(alice).patch(`/posts/${post.id}`, { caption: "x" }).expect(404);
  });

  it("cannot clear the caption of a post without an image", async () => {
    const post = await createPost(alice);
    await as(alice).patch(`/posts/${post.id}`, { caption: "" }).expect(400);
  });

  it("limits the edited caption length", async () => {
    const post = await createPost(alice);
    await as(alice).patch(`/posts/${post.id}`, { caption: "x".repeat(4001) }).expect(400);
    await as(alice).patch(`/posts/${post.id}`, { caption: 42 }).expect(400);
  });

  it("returns 400 for a malformed post id", async () => {
    await as(alice).patch("/posts/not-an-id", { caption: "x" }).expect(400);
  });
});

describe("feed visibility", () => {
  it("shows the user's own posts and their friends' posts only", async () => {
    await createPost(alice, "from alice");
    await createPost(bob, "from bob");
    await createPost(dave, "from dave");

    const aliceFeed = await as(alice).get("/posts").expect(200);
    expect(aliceFeed.body.posts.map((p) => p.caption).sort()).toEqual(["from alice", "from bob"]);

    const daveFeed = await as(dave).get("/posts").expect(200);
    expect(daveFeed.body.posts.map((p) => p.caption)).toEqual(["from dave"]);
  });

  it("filters by author, returning nothing for a non-friend", async () => {
    await createPost(alice, "from alice");
    await createPost(bob, "from bob");

    const byBob = await as(alice).get(`/posts?authorId=${bob.user.id}`).expect(200);
    expect(byBob.body.posts.map((p) => p.caption)).toEqual(["from bob"]);

    const strangerView = await as(dave).get(`/posts?authorId=${alice.user.id}`).expect(200);
    expect(strangerView.body.posts).toEqual([]);

    await as(alice).get("/posts?authorId=bad-id").expect(400);
  });

  it("pages newest first with a before cursor", async () => {
    for (const caption of ["p1", "p2", "p3"]) await createPost(alice, caption);

    const page1 = await as(alice).get("/posts?limit=2").expect(200);
    expect(page1.body.posts.map((p) => p.caption)).toEqual(["p3", "p2"]);
    expect(page1.body.pageInfo.hasMore).toBe(true);

    const before = encodeURIComponent(page1.body.pageInfo.nextBefore);
    const page2 = await as(alice).get(`/posts?limit=2&before=${before}`).expect(200);
    expect(page2.body.posts.map((p) => p.caption)).toEqual(["p1"]);
    expect(page2.body.pageInfo.hasMore).toBe(false);

    await as(alice).get("/posts?before=not-a-date").expect(400);
  });

  it("strangers cannot interact with a post", async () => {
    const post = await createPost(alice);

    await as(dave).post(`/posts/${post.id}/likes`).expect(404);
    await as(dave).post(`/posts/${post.id}/comments`, { text: "hi" }).expect(404);
  });
});

describe("likes", () => {
  it("toggles a like on and off", async () => {
    const post = await createPost(alice);

    const liked = await as(bob).post(`/posts/${post.id}/likes`).expect(200);
    expect(liked.body).toMatchObject({ liked: true, likeCount: 1 });
    expect((await getFeedPost(bob, post.id)).likedByViewer).toBe(true);
    expect((await getFeedPost(alice, post.id)).likedByViewer).toBe(false);

    const unliked = await as(bob).post(`/posts/${post.id}/likes`).expect(200);
    expect(unliked.body).toMatchObject({ liked: false, likeCount: 0 });
  });
});

describe("comments and replies", () => {
  let post;

  beforeEach(async () => {
    post = await createPost(alice);
  });

  it("adds a comment and a reply, both visible in the feed", async () => {
    const comment = await addComment(bob, post.id, "  nice  ");
    expect(comment).toMatchObject({ text: "nice", authorName: "Bob", isOwn: true, replies: [] });

    const res = await as(alice).post(`/posts/${post.id}/comments/${comment.id}/replies`, { text: "thanks" }).expect(201);
    expect(res.body.reply).toMatchObject({ text: "thanks", authorName: "Alice" });

    const feedPost = await getFeedPost(alice, post.id);
    expect(feedPost.comments).toHaveLength(1);
    expect(feedPost.comments[0]).toMatchObject({ text: "nice", isOwn: false });
    expect(feedPost.comments[0].replies[0]).toMatchObject({ text: "thanks", isOwn: true });
  });

  it("validates comment and reply text", async () => {
    await as(bob).post(`/posts/${post.id}/comments`, { text: "" }).expect(400);
    await as(bob).post(`/posts/${post.id}/comments`, { text: "x".repeat(1001) }).expect(400);

    const comment = await addComment(bob, post.id);
    const res = await as(bob).post(`/posts/${post.id}/comments/${comment.id}/replies`, { text: "" }).expect(400);
    expect(res.body.message).toMatch(/Reply text is required/);
  });

  it("only the author can edit or delete a comment", async () => {
    const comment = await addComment(bob, post.id);

    await as(bob).patch(`/posts/${post.id}/comments/${comment.id}`, { text: "  " }).expect(400);
    await as(alice).patch(`/posts/${post.id}/comments/${comment.id}`, { text: "x" }).expect(403);
    await as(alice).delete(`/posts/${post.id}/comments/${comment.id}`).expect(403);

    const edited = await as(bob).patch(`/posts/${post.id}/comments/${comment.id}`, { text: "edited" }).expect(200);
    expect(edited.body.text).toBe("edited");

    await as(bob).delete(`/posts/${post.id}/comments/${comment.id}`).expect(200);
    expect((await getFeedPost(alice, post.id)).comments).toEqual([]);
  });

  it("deleting a reply keeps its parent comment", async () => {
    const comment = await addComment(bob, post.id);
    const res = await as(alice).post(`/posts/${post.id}/comments/${comment.id}/replies`, { text: "r" }).expect(201);

    await as(alice).delete(`/posts/${post.id}/comments/${res.body.reply.id}`).expect(200);

    const feedPost = await getFeedPost(alice, post.id);
    expect(feedPost.comments).toHaveLength(1);
    expect(feedPost.comments[0].replies).toEqual([]);
  });

  it("toggles likes on comments and replies", async () => {
    const comment = await addComment(bob, post.id);
    const reply = (await as(alice).post(`/posts/${post.id}/comments/${comment.id}/replies`, { text: "r" }).expect(201)).body.reply;

    const likedComment = await as(alice).post(`/posts/${post.id}/comments/${comment.id}/likes`).expect(200);
    expect(likedComment.body).toMatchObject({ liked: true, likeCount: 1 });
    await as(bob).post(`/posts/${post.id}/comments/${reply.id}/likes`).expect(200);

    const feedPost = await getFeedPost(alice, post.id);
    expect(feedPost.comments[0]).toMatchObject({ likeCount: 1, likedByViewer: true });
    expect(feedPost.comments[0].replies[0]).toMatchObject({ likeCount: 1, likedByViewer: false });
  });

  it("returns 404 for an unknown comment", async () => {
    const unknownId = "507f1f77bcf86cd799439011";
    await as(bob).post(`/posts/${post.id}/comments/${unknownId}/replies`, { text: "r" }).expect(404);
    await as(bob).patch(`/posts/${post.id}/comments/${unknownId}`, { text: "x" }).expect(404);
    await as(bob).post(`/posts/${post.id}/comments/${unknownId}/likes`).expect(404);
  });
});
