import { useState } from 'react';

import { HOME_SECTION } from './homeSections';

function SkeletonLine({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-[#e4e6eb] ${className}`} />;
}

function PostSkeleton() {
  return (
    <article className="overflow-hidden rounded-lg border border-[#e4e6eb] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-3 p-4">
        <SkeletonLine className="h-10 w-10 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-3.5 w-32" />
          <SkeletonLine className="h-3 w-24" />
        </div>
      </div>
      <SkeletonLine className="h-48 w-full rounded-none" />
      <div className="space-y-2 p-4">
        <SkeletonLine className="h-3 w-full" />
        <SkeletonLine className="h-3 w-4/5" />
      </div>
    </article>
  );
}

function FeedAvatar({ user, displayName, className = 'h-10 w-10 text-sm' }) {
  const [imgError, setImgError] = useState(false);
  const initial = displayName?.[0]?.toUpperCase() || '?';

  if (user?.avatarUrl && !imgError) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        onError={() => setImgError(true)}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 ${className}`}
    >
      {initial}
    </div>
  );
}

export default function HomeSectionView({ displayName, user, onSelectSection }) {
  return (
    <div className="mx-auto w-full max-w-[900px] space-y-4 px-4 py-6">
      <section className="rounded-lg border border-[#e4e6eb] bg-white p-4 shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)]">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => onSelectSection?.(HOME_SECTION.profile)}
            className="rounded-full focus:outline-none"
            aria-label="Open profile"
          >
            <FeedAvatar user={user} displayName={displayName} />
          </button>
          <div className="min-w-0 flex-1">
            <label htmlFor="home-composer" className="sr-only">
              Create a post
            </label>
            <textarea
              id="home-composer"
              rows={2}
              readOnly
              placeholder={`${displayName}, what's on your mind?`}
              className="w-full cursor-default resize-none rounded-xl border border-[#e4e6eb] bg-[#f0f2f5] px-4 py-3 text-sm text-[#1c1e21] outline-none placeholder:text-[#8a8d91]"
            />
            <div className="mt-3 flex flex-wrap gap-2 border-t border-[#f0f2f5] pt-3">
              <button
                type="button"
                className="inline-flex cursor-default items-center gap-1.5 rounded-full bg-[#f0f2f5] px-4 py-1.5 text-xs font-semibold text-[#65676b] transition-colors hover:bg-[#e4e6eb]"
              >
                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                Photo / Video
              </button>
              <button
                type="button"
                className="inline-flex cursor-default items-center gap-1.5 rounded-full bg-[#f0f2f5] px-4 py-1.5 text-xs font-semibold text-[#65676b] transition-colors hover:bg-[#e4e6eb]"
              >
                <svg className="h-4 w-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                </svg>
                Feeling
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-bold text-[#1c1e21]">Feed</h2>
        <span className="text-xs font-medium text-[#8a8d91]">API integration coming soon</span>
      </div>
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    </div>
  );
}
