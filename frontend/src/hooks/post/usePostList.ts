import { useCallback, useEffect, useState } from "react";

import {
  addPostComment,
  addPostReply,
  deletePost,
  deletePostComment,
  getPosts,
  togglePostCommentLike,
  togglePostLike,
  updatePost,
  updatePostComment,
} from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";
import type { Id, Post, PostActionHandlers } from "../../types";

const POST_PAGE_LIMIT = 20;

interface UsePostListOptions {
  /** Only load posts by this author; omit for the whole feed. */
  authorId?: Id | null;
  /** When false the list is cleared and nothing is fetched (e.g. the author is not known yet). */
  enabled?: boolean;
  /** Changing this value reloads the first page (e.g. after the viewer's relationship changes). */
  reloadKey?: string;
}

/**
 * A paginated list of posts plus the actions FeedPostCard needs. Every action calls the API
 * and then patches the matching post in the list, so the parent and the card stay in sync.
 */
export function usePostList({ authorId, enabled = true, reloadKey = "" }: UsePostListOptions = {}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) {
      setPosts([]);
      setIsLoading(false);
      setError("");
      setHasMore(false);
      setNextCursor(null);
      return undefined;
    }

    let cancelled = false;
    async function loadFirstPage() {
      setIsLoading(true);
      setError("");
      try {
        const data = await getPosts({ authorId: authorId ?? undefined, limit: POST_PAGE_LIMIT });
        if (cancelled) return;
        setPosts(data?.posts || []);
        setHasMore(Boolean(data?.pageInfo?.hasMore));
        setNextCursor(data?.pageInfo?.nextBefore || null);
      } catch (err) {
        if (!cancelled) {
          setPosts([]);
          setHasMore(false);
          setNextCursor(null);
          setError(getErrorMessage(err, "Failed to load posts"));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadFirstPage();
    return () => {
      cancelled = true;
    };
  }, [authorId, enabled, reloadKey]);

  const loadMore = useCallback(async () => {
    if (!enabled || !hasMore || !nextCursor || isLoadingMore || isLoading) return;

    setIsLoadingMore(true);
    setError("");
    try {
      const data = await getPosts({
        authorId: authorId ?? undefined,
        limit: POST_PAGE_LIMIT,
        before: nextCursor,
      });
      const nextPosts = data?.posts || [];
      setPosts((prevPosts) => {
        const existingIds = new Set(prevPosts.map((post) => post.id));
        return [...prevPosts, ...nextPosts.filter((post) => !existingIds.has(post.id))];
      });
      setHasMore(Boolean(data?.pageInfo?.hasMore));
      setNextCursor(data?.pageInfo?.nextBefore || null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load more posts"));
    } finally {
      setIsLoadingMore(false);
    }
  }, [authorId, enabled, hasMore, isLoading, isLoadingMore, nextCursor]);

  const updatePostById = (postId: Id, updater: (post: Post) => Post) => {
    setPosts((prevPosts) => prevPosts.map((post) => (post.id === postId ? updater(post) : post)));
  };

  const actions: Required<PostActionHandlers> = {
    onTogglePostLike: async (postId) => {
      const data = await togglePostLike({ postId });
      updatePostById(postId, (post) => ({ ...post, likedByViewer: data.liked, likeCount: data.likeCount }));
      return data;
    },

    onDeletePost: async (postId) => {
      await deletePost({ postId });
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    },

    onUpdatePost: async (postId, caption) => {
      const data = await updatePost({ postId, caption });
      if (data?.post) {
        updatePostById(postId, () => data.post);
      }
      return data?.post;
    },

    onAddComment: async (postId, text) => {
      const data = await addPostComment({ postId, text });
      if (data?.comment) {
        updatePostById(postId, (post) => ({ ...post, comments: [...(post.comments || []), data.comment] }));
      }
      return data?.comment;
    },

    onAddReply: async (postId, commentId, text) => {
      const data = await addPostReply({ postId, commentId, text });
      if (data?.reply) {
        updatePostById(postId, (post) => ({
          ...post,
          comments: (post.comments || []).map((comment) => (
            comment.id === commentId
              ? { ...comment, replies: [...(comment.replies || []), data.reply] }
              : comment
          )),
        }));
      }
      return data?.reply;
    },

    // `commentId` may be a top-level comment or a reply, so both levels are checked.
    onUpdateComment: async (postId, commentId, text) => {
      await updatePostComment({ postId, commentId, text });
      updatePostById(postId, (post) => ({
        ...post,
        comments: (post.comments || []).map((comment) => {
          if (comment.id === commentId) return { ...comment, text };
          return {
            ...comment,
            replies: (comment.replies || []).map((reply) => (reply.id === commentId ? { ...reply, text } : reply)),
          };
        }),
      }));
    },

    onDeleteComment: async (postId, commentId) => {
      await deletePostComment({ postId, commentId });
      updatePostById(postId, (post) => ({
        ...post,
        comments: (post.comments || [])
          .filter((comment) => comment.id !== commentId)
          .map((comment) => ({
            ...comment,
            replies: (comment.replies || []).filter((reply) => reply.id !== commentId),
          })),
      }));
    },

    onToggleCommentLike: async (postId, commentId) => {
      const data = await togglePostCommentLike({ postId, commentId });
      const patch = { likedByViewer: data.liked, likeCount: data.likeCount };
      updatePostById(postId, (post) => ({
        ...post,
        comments: (post.comments || []).map((comment) => {
          if (comment.id === commentId) return { ...comment, ...patch };
          return {
            ...comment,
            replies: (comment.replies || []).map((reply) => (reply.id === commentId ? { ...reply, ...patch } : reply)),
          };
        }),
      }));
      return data;
    },
  };

  return {
    posts,
    /** For changes made outside the actions above (e.g. prepending a newly created post). */
    setPosts,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    setError,
    loadMore,
    actions,
  };
}
