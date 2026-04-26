import { useEffect, useRef, useState } from "react";

function CommentAvatar({ avatarUrl, authorName }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={authorName}
        className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-black/5"
      />
    );
  }

  const initial = authorName?.[0]?.toUpperCase() || "?";
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
      {initial}
    </div>
  );
}

export default function FeedPostCard({ post, viewerName, viewerAvatar }) {
  const MAX_COMMENT_INPUT_ROWS = 3;
  const [isLiked, setIsLiked] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [openCommentMenuId, setOpenCommentMenuId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [comments, setComments] = useState(post.comments || []);
  const commentInputRef = useRef(null);

  const totalLikes = post.likeCount + (isLiked ? 1 : 0);
  const totalComments = comments.length;

  useEffect(() => {
    if (!commentInputRef.current) return;

    commentInputRef.current.style.height = "auto";
    const lineHeight = 20;
    const maxHeight = lineHeight * MAX_COMMENT_INPUT_ROWS;
    const nextHeight = Math.min(commentInputRef.current.scrollHeight, maxHeight);
    commentInputRef.current.style.height = `${nextHeight}px`;
    commentInputRef.current.style.overflowY =
      commentInputRef.current.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [commentInput]);

  useEffect(() => {
    if (!openCommentMenuId) return undefined;

    const handleOutsideClick = () => {
      setOpenCommentMenuId(null);
    };

    window.addEventListener("click", handleOutsideClick);
    return () => {
      window.removeEventListener("click", handleOutsideClick);
    };
  }, [openCommentMenuId]);

  const handleSubmitComment = (event) => {
    event.preventDefault();

    const cleanComment = commentInput.trim();
    if (!cleanComment) return;

    const nextComment = {
      id: `c_${Date.now()}`,
      authorName: viewerName || "You",
      authorAvatar: viewerAvatar || "https://i.pravatar.cc/100?img=8",
      text: cleanComment,
      isOwn: true,
    };

    setComments((prevComments) => [...prevComments, nextComment]);
    setCommentInput("");
    setIsCommentOpen(true);
  };

  const handleCommentInputKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmitComment(event);
    }
  };

  const handleDeleteComment = (commentId) => {
    setComments((prevComments) => prevComments.filter((comment) => comment.id !== commentId));
    setOpenCommentMenuId(null);
  };

  const handleStartEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
    setOpenCommentMenuId(null);
  };

  const handleSaveEditComment = () => {
    const cleanText = editingCommentText.trim();
    if (!cleanText || !editingCommentId) return;

    setComments((prevComments) =>
      prevComments.map((comment) =>
        comment.id === editingCommentId ? { ...comment, text: cleanText } : comment
      )
    );
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  return (
    <article className="overflow-hidden rounded-lg border border-[#e4e6eb] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-3 p-4">
        <img
          src={post.authorAvatar}
          alt={post.authorName}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#1c1e21]">{post.authorName}</p>
          <p className="text-xs text-[#8a8d91]">{post.createdAt}</p>
        </div>
      </div>

      <p className="px-4 pb-3 text-sm text-[#1c1e21]">{post.caption}</p>

      {post.imageUrl ? <img src={post.imageUrl} alt="Feed post" className="h-auto w-full object-cover" /> : null}

      <div className="flex items-center justify-between border-t border-[#f0f2f5] px-4 py-3 text-xs font-medium text-[#65676b]">
        <span>{totalLikes} likes</span>
        <span>{totalComments} comments</span>
      </div>

      <div className="grid grid-cols-4 border-t border-[#f0f2f5] px-3 py-2">
        <button
          type="button"
          onClick={() => setIsLiked((prevState) => !prevState)}
          className={`col-start-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition ${
            isLiked ? "bg-indigo-50 text-indigo-600" : "text-[#65676b] hover:bg-[#f0f2f5]"
          }`}
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
            <path d="M7 10v12" />
          </svg>
          Like
        </button>
        <button
          type="button"
          onClick={() => setIsCommentOpen((prevState) => !prevState)}
          className={`col-start-4 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition ${
            isCommentOpen ? "bg-indigo-50 text-indigo-600" : "text-[#65676b] hover:bg-[#f0f2f5]"
          }`}
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />
          </svg>
          Comment
        </button>
      </div>

      {isCommentOpen && (
        <div className="space-y-3 border-t border-[#f0f2f5] px-4 py-3">
          <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-2">
                <CommentAvatar avatarUrl={comment.authorAvatar} authorName={comment.authorName} />
                <div className="relative min-w-0 flex-1 pr-8">
                  <div className="max-w-[95%] rounded-lg bg-[#f0f2f5] px-3 py-2">
                    <p className="text-xs font-semibold text-[#1c1e21]">{comment.authorName}</p>
                    {editingCommentId === comment.id ? (
                      <div className="mt-1 space-y-2">
                        <textarea
                          value={editingCommentText}
                          onChange={(event) => setEditingCommentText(event.target.value)}
                          rows={2}
                          className="w-full resize-none rounded-md border border-[#dddfe2] bg-white px-2 py-1.5 text-sm text-[#1c1e21] outline-none focus:border-indigo-500"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSaveEditComment}
                            className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditingCommentText("");
                            }}
                            className="rounded-md px-2.5 py-1 text-xs font-semibold text-[#65676b] hover:bg-[#e4e6eb]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-0.5 break-words whitespace-pre-wrap text-sm text-[#1c1e21]">
                        {comment.text}
                      </p>
                    )}
                  </div>

                  {comment.isOwn && editingCommentId !== comment.id && (
                    <>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenCommentMenuId((prevId) => (prevId === comment.id ? null : comment.id));
                        }}
                        className="absolute right-0 bottom-1 flex h-6 w-6 items-center justify-center rounded-full text-[#65676b] transition hover:bg-[#e4e6eb]"
                        aria-label="Open comment menu"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M3 10a2 2 0 114 0 2 2 0 01-4 0zm5 0a2 2 0 114 0 2 2 0 01-4 0zm5 0a2 2 0 114 0 2 2 0 01-4 0z" />
                        </svg>
                      </button>

                      {openCommentMenuId === comment.id && (
                        <div
                          onClick={(event) => event.stopPropagation()}
                          className="absolute right-8 bottom-0 z-10 min-w-[130px] rounded-md border border-[#e4e6eb] bg-white py-1 shadow-lg"
                        >
                          <button
                            type="button"
                            onClick={() => handleStartEditComment(comment)}
                            className="w-full px-3 py-2 text-left text-sm text-[#1c1e21] hover:bg-[#f0f2f5]"
                          >
                            Edit comment
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                          >
                            Delete comment
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmitComment} className="flex items-end gap-2">
            <textarea
              ref={commentInputRef}
              value={commentInput}
              onChange={(event) => setCommentInput(event.target.value)}
              onKeyDown={handleCommentInputKeyDown}
              placeholder="Write a comment..."
              rows={1}
              className="min-h-[40px] max-h-[60px] flex-1 resize-none rounded-2xl border border-[#dddfe2] bg-white px-4 py-2 text-sm leading-5 outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!commentInput.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              aria-label="Post comment"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.999 2.813a1 1 0 00-1.356-.93L2.32 9.21a1 1 0 00.067 1.87l7.207 2.403 2.404 7.206a1 1 0 001.87.067l7.327-18.322a.998.998 0 00-.196-1.093zM11.168 12.83l-5.2-1.734L18.186 6.21l-7.018 6.62zm1.734 5.2l-1.733-5.2 6.62-7.018-4.887 12.218z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
