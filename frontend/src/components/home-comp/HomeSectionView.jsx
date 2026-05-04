import { useRef, useState } from "react";

import FeedComposer from "./feed/FeedComposer.jsx";
import FeedPostCard from "./feed/FeedPostCard.jsx";
import PostSkeleton from "./feed/PostSkeleton.jsx";
import { HOME_SECTION, HOME_SUB_SECTION } from "../../lib/homeSections";

const MOCK_FEED_POST = {
  id: "post_1",
  authorId: "demo_minh_anh",
  authorName: "Minh Anh",
  authorAvatar: "https://i.pravatar.cc/100?img=12",
  createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  caption:
    "Finished the chat section UI today. Next step is wiring it to API and polishing group chat interactions.",
  imageUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80",
  likeCount: 18,
  comments: [
    {
      id: "c_1",
      authorId: "demo_lan_huong",
      authorName: "Lan Huong",
      authorAvatar: "https://i.pravatar.cc/100?img=16",
      text: "Looks clean! Waiting for API integration.",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      likeCount: 4,
      replies: [
        {
          id: "r_1",
          authorId: "demo_minh_anh",
          authorName: "Minh Anh",
          authorAvatar: "https://i.pravatar.cc/100?img=12",
          text: "Sounds good, ping me when the API is wired.",
          createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          likeCount: 2,
        },
      ],
    },
    {
      id: "c_2",
      authorId: "demo_tuan_dev",
      authorName: "Tuan Dev",
      authorAvatar: "https://i.pravatar.cc/100?img=28",
      text: "Great progress, nice UI polish.",
      createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
      likeCount: 0,
      replies: [
        {
          id: "r_2",
          authorId: "demo_lan_huong",
          authorName: "Lan Huong",
          authorAvatar: "https://i.pravatar.cc/100?img=16",
          text: "Same here, looks solid.",
          createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
          likeCount: 1,
        },
        {
          id: "r_3",
          authorId: "demo_minh_anh",
          authorName: "Minh Anh",
          authorAvatar: "https://i.pravatar.cc/100?img=12",
          text: "Thanks, will keep iterating.",
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          likeCount: 0,
        },
      ],
    },
  ],
};

export default function HomeSectionView({ displayName, user, subSection, onOpenProfile, onSelectSection }) {
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
      authorId: user?.id,
      authorName: displayName || "You",
      authorAvatar: user?.avatarUrl || "https://i.pravatar.cc/100?img=8",
      createdAt: new Date().toISOString(),
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

  const activeSubSection = subSection || HOME_SUB_SECTION.home_feed;
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
        {feedPosts.map((post) => (
          <FeedPostCard
            key={post.id}
            post={post}
            viewerName={displayName}
            viewerAvatar={user?.avatarUrl}
            viewerId={user?.id}
            onOpenProfile={onOpenProfile}
          />
        ))}
        {isPosting && <PostSkeleton />}
        <PostSkeleton />
      </div>
    </div>
  );
}
