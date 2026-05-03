import { useRef, useState } from "react";

import FeedComposer from "./feed/FeedComposer.jsx";
import FeedPostCard from "./feed/FeedPostCard.jsx";
import PostSkeleton from "./feed/PostSkeleton.jsx";
import { HOME_SECTION } from "../../lib/homeSections";

const MOCK_FEED_POST = {
  id: "post_1",
  authorName: "Minh Anh",
  authorAvatar: "https://i.pravatar.cc/100?img=12",
  createdAt: "2h",
  caption:
    "Finished the chat section UI today. Next step is wiring it to API and polishing group chat interactions.",
  imageUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80",
  likeCount: 18,
  comments: [
    {
      id: "c_1",
      authorName: "Lan Huong",
      authorAvatar: "https://i.pravatar.cc/100?img=16",
      text: "Looks clean! Waiting for API integration.",
    },
    {
      id: "c_2",
      authorName: "Tuan Dev",
      authorAvatar: "https://i.pravatar.cc/100?img=28",
      text: "Great progress, nice UI polish.",
    },
  ],
};

export default function HomeSectionView({ displayName, user, onOpenProfile, onSelectSection }) {
  const [composerText, setComposerText] = useState("");
  const [composerImageUrl, setComposerImageUrl] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [feedPosts, setFeedPosts] = useState([MOCK_FEED_POST]);
  const composerFileInputRef = useRef(null);

  const handleCreatePost = async () => {
    const cleanText = composerText.trim();
    if ((!cleanText && !composerImageUrl) || isPosting) return;

    setIsPosting(true);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 650);
    });

    const newPost = {
      id: `post_${Date.now()}`,
      authorName: displayName || "You",
      authorAvatar: user?.avatarUrl || "https://i.pravatar.cc/100?img=8",
      createdAt: "Just now",
      caption: cleanText,
      imageUrl: composerImageUrl || null,
      likeCount: 0,
      comments: [],
    };

    setFeedPosts((prevPosts) => [newPost, ...prevPosts]);
    setComposerText("");
    setComposerImageUrl("");
    setIsPosting(false);
  };

  const handleComposerKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleCreatePost();
    }
  };

  const handleAttachImage = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setComposerImageUrl(URL.createObjectURL(selectedFile));
    event.target.value = "";
  };

  return (
    <div className="mx-auto w-full max-w-[900px] space-y-4 px-4 py-6">
      <FeedComposer
        displayName={displayName}
        user={user}
        onOpenProfile={() => onSelectSection?.(HOME_SECTION.profile)}
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
        {feedPosts.map((post) => (
          <FeedPostCard
            key={post.id}
            post={post}
            viewerName={displayName}
            viewerAvatar={user?.avatarUrl}
            onOpenProfile={onOpenProfile}
          />
        ))}
        {isPosting && <PostSkeleton />}
        <PostSkeleton />
      </div>
    </div>
  );
}
