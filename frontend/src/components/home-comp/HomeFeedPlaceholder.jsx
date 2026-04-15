import { HOME_SECTION } from './homeSections';

function SkeletonLine({ className = '' }) {
  return <div className={`rounded-md bg-[#e4e6eb] animate-pulse ${className}`} />;
}

function PostSkeleton({ className = '' }) {
  return (
    <article
      className={`bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.06)] border border-[#e4e6eb] overflow-hidden ${className}`}
    >
      <div className="p-4 flex items-center gap-3">
        <SkeletonLine className="w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-3.5 w-32" />
          <SkeletonLine className="h-3 w-24" />
        </div>
      </div>
      <SkeletonLine className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <SkeletonLine className="h-3 w-full" />
        <SkeletonLine className="h-3 w-4/5" />
      </div>
    </article>
  );
}

function FeedShell({ title, description, children }) {
  return (
    <div className="w-full max-w-[680px] mx-auto px-4 py-6 space-y-4">
      <div className="rounded-xl border border-[#e4e6eb] bg-white px-4 py-3">
        <h1 className="text-xl font-bold text-[#1c1e21]">{title}</h1>
        {description ? <p className="mt-1 text-sm text-[#65676b]">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

export default function HomeFeedPlaceholder({ displayName, section }) {
  if (section === HOME_SECTION.home) {
    return (
      <div className="w-full max-w-[680px] mx-auto px-4 py-6 space-y-4">
        <section className="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.06)] border border-[#e4e6eb] p-4">
          <div className="flex gap-3 items-start">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center shrink-0 text-sm">
              {(displayName && displayName[0]) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <label htmlFor="home-composer" className="sr-only">
                Tạo bài viết
              </label>
              <textarea
                id="home-composer"
                rows={2}
                readOnly
                placeholder="Bạn đang nghĩ gì thế?"
                className="w-full resize-none rounded-xl bg-[#f0f2f5] border-0 px-4 py-3 text-sm text-[#1c1e21] placeholder:text-[#8a8d91] outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-default"
              />
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#f0f2f5]">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#65676b] bg-[#f0f2f5]">
                  Ảnh/video
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#65676b] bg-[#f0f2f5]">
                  Cảm xúc
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-[#1c1e21]">Bảng tin</h2>
          <span className="text-xs font-medium text-[#8a8d91]">Chưa có bài viết</span>
        </div>

        <div className="space-y-4">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      </div>
    );
  }

  if (section === HOME_SECTION.messages) {
    return (
      <FeedShell
        title="Tin nhắn"
        description="Chọn một cuộc trò chuyện ở cột bên cạnh để xem nội dung tại đây (sắp kết nối API)."
      >
        <div className="rounded-xl border border-dashed border-[#ccd0d5] bg-white/80 py-16 text-center text-sm text-[#65676b]">
          Chưa chọn hội thoại
        </div>
      </FeedShell>
    );
  }

  if (section === HOME_SECTION.friends) {
    return (
      <FeedShell
        title="Bạn bè"
        description="Xem lời mời và danh sách bạn ở sidebar — khu vực này sẽ hiển thị chi tiết khi bạn chọn một mục."
      >
        <div className="rounded-xl border border-dashed border-[#ccd0d5] bg-white/80 py-16 text-center text-sm text-[#65676b]">
          Chọn một người bạn hoặc lời mời để xem chi tiết
        </div>
      </FeedShell>
    );
  }

  if (section === HOME_SECTION.profile) {
    return (
      <FeedShell
        title="Hồ sơ"
        description={`Xin chào, ${displayName}. Chỉnh sửa thông tin và bài đăng sẽ hiển thị ở đây.`}
      >
        <div className="space-y-3">
          <PostSkeleton />
        </div>
      </FeedShell>
    );
  }

  if (section === HOME_SECTION.settings) {
    return (
      <FeedShell
        title="Cài đặt"
        description="Các tùy chọn chi tiết sẽ mở tại đây khi bạn chọn mục trong sidebar cấp 2."
      >
        <div className="rounded-xl border border-[#e4e6eb] bg-white p-4 text-sm text-[#65676b]">
          Chưa có mục cài đặt được chọn.
        </div>
      </FeedShell>
    );
  }

  return null;
}
