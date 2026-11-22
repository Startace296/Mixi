import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";

import FeedComposer from "./feed/FeedComposer";
import FeedPostCard from "./feed/FeedPostCard";
import PostSkeleton from "./feed/PostSkeleton";
import { HOME_SECTION, HOME_SUB_SECTION, type HomeSection, type HomeSubSection } from "../../lib/navigation";
import { createPost } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";
import { usePostList } from "../../hooks/post";
import type { AuthUser, OpenProfileHandler } from "../../types";

interface HomeSectionViewProps {
  displayName: string;
  user: AuthUser | null | undefined;
  subSection: HomeSubSection | null | undefined;
  onOpenProfile?: OpenProfileHandler;
  onSelectSection?: (section: HomeSection) => void;
}

export default function HomeSectionView({ displayName, user, subSection, onOpenProfile, onSelectSection }: HomeSectionViewProps) {
  const [composerText, setComposerText] = useState("");
  const [composerImageUrl, setComposerImageUrl] = useState("");
  const [composerImageFile, setComposerImageFile] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const {
    posts: feedPosts,
    setPosts: setFeedPosts,
    isLoading: isLoadingPosts,
    isLoadingMore: isLoadingMorePosts,
    hasMore: hasMorePosts,
    error: feedError,
    setError: setFeedError,
    loadMore: handleLoadMorePosts,
    actions: postActions,
  } = usePostList();
  const composerFileInputRef = useRef<HTMLInputElement>(null);
  const composerObjectUrlsRef = useRef(new Set<string>());
  const feedLoadMoreRef = useRef<HTMLDivElement>(null);
  const activeSubSection = subSection || HOME_SUB_SECTION.home_feed;

  useEffect(() => {
    const objectUrls = composerObjectUrlsRef.current;
    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.clear();
    };
  }, []);

  useEffect(() => {
    const loadMoreElement = feedLoadMoreRef.current;
    if (!loadMoreElement || activeSubSection !== HOME_SUB_SECTION.home_feed) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          handleLoadMorePosts();
        }
      },
      { rootMargin: "600px 0px" },
    );

    observer.observe(loadMoreElement);
    return () => observer.disconnect();
  }, [activeSubSection, handleLoadMorePosts]);

  const handleCreatePost = async () => {
    const cleanText = composerText.trim();
    if ((!cleanText && !composerImageUrl) || isPosting) return;

    setIsPosting(true);
    setFeedError("");

    try {
      const data = await createPost({
        caption: cleanText,
        image: composerImageFile,
      });

      if (data?.post) {
        setFeedPosts((prevPosts) => [data.post, ...prevPosts]);
      }
      setComposerText("");
      if (composerImageUrl) {
        URL.revokeObjectURL(composerImageUrl);
        composerObjectUrlsRef.current.delete(composerImageUrl);
      }
      setComposerImageUrl("");
      setComposerImageFile(null);
    } catch (err) {
      setFeedError(getErrorMessage(err, "Failed to create post"));
    } finally {
      setIsPosting(false);
    }
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleCreatePost();
    }
  };

  const handleAttachImage = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (composerImageUrl) URL.revokeObjectURL(composerImageUrl);
    composerObjectUrlsRef.current.delete(composerImageUrl);
    const previewUrl = URL.createObjectURL(selectedFile);
    composerObjectUrlsRef.current.add(previewUrl);
    setComposerImageUrl(previewUrl);
    setComposerImageFile(selectedFile);
    event.target.value = "";
  };

  if (activeSubSection !== HOME_SUB_SECTION.home_feed) return null;

  return (
    <div className="mx-auto w-full max-w-[900px] space-y-4 px-4 py-6">
      <FeedComposer
        displayName={displayName}
        user={user}
        onAvatarClick={() => onSelectSection?.(HOME_SECTION.profile)}
        composerText={composerText}
        onComposerTextChange={setComposerText}
        onComposerKeyDown={handleComposerKeyDown}
        composerImageUrl={composerImageUrl}
        onAttachImage={handleAttachImage}
        composerFileInputRef={composerFileInputRef}
        onCreatePost={handleCreatePost}
        isPosting={isPosting}
        canPost={Boolean(composerText.trim() || composerImageUrl)}
      />

      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-bold text-[#1c1e21]">Feed</h2>
      </div>
      <div className="space-y-4">
        {feedError ? (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {feedError}
          </div>
        ) : null}
        {isLoadingPosts ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : null}
        {feedPosts.map((post) => (
          <FeedPostCard
            key={post.id}
            post={post}
            viewerId={user?.id}
            onOpenProfile={onOpenProfile}
            {...postActions}
          />
        ))}
        {isPosting && <PostSkeleton />}
        {isLoadingMorePosts ? <PostSkeleton /> : null}
        {hasMorePosts ? <div ref={feedLoadMoreRef} className="h-4" aria-hidden /> : null}
        {!isLoadingPosts && !feedPosts.length && !feedError ? (
          <div className="rounded-lg border border-[#e4e6eb] bg-white px-4 py-8 text-center text-sm font-medium text-[#65676b]">
            No posts yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}
