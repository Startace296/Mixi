import { HOME_SECTION, HOME_SUB_SECTION } from './homeSections';

// ─── Shared primitives ───────────────────────────────────────────────────────

function SkeletonLine({ className = '' }) {
  return <div className={`rounded-md bg-[#e4e6eb] animate-pulse ${className}`} />;
}

function PostSkeleton() {
  return (
    <article className="bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)] border border-[#e4e6eb] overflow-hidden">
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

function EmptyState({ icon, title, description }) {
  return (
    <div className="bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)] border border-[#e4e6eb] py-16 px-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-400">
        {icon}
      </div>
      <p className="text-base font-semibold text-[#1c1e21]">{title}</p>
      {description && <p className="mt-1 text-sm text-[#65676b]">{description}</p>}
    </div>
  );
}

function FeedShell({ title, description, children }) {
  return (
    <div className="w-full max-w-[900px] mx-auto px-4 py-6 space-y-4">
      <div className="rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)] border border-[#e4e6eb] bg-white px-5 py-4">
        <h1 className="text-xl font-bold text-[#1c1e21]">{title}</h1>
        {description && <p className="mt-1 text-sm text-[#65676b]">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function SectionDivider({ title, count }) {
  return (
    <div className="flex items-center justify-between px-1 pt-2">
      <h2 className="text-base font-bold text-[#1c1e21]">{title}</h2>
      {count != null && <span className="text-xs font-medium text-[#8a8d91]">{count} người</span>}
    </div>
  );
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_REQUESTS = [
  { id: 'r1', name: 'Mai Linh', mutual: '3 bạn chung' },
  { id: 'r2', name: 'Hữu Phước', mutual: 'Gợi ý cho bạn' },
];

const MOCK_FRIENDS = [
  { id: 'f1', name: 'Quốc Huy', mutual: '12 bạn chung' },
  { id: 'f2', name: 'Thu Trang', mutual: '5 bạn chung' },
  { id: 'f3', name: 'Đức Anh', mutual: '1 bạn chung' },
];

// ─── Friend cards ─────────────────────────────────────────────────────────────

function FriendRequestCard({ name, mutual }) {
  return (
    <div className="bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)] border border-[#e4e6eb] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center text-base">
          {name[0]}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#1c1e21] truncate">{name}</p>
          <p className="text-xs text-[#65676b]">{mutual}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" className="flex-1 rounded-full bg-indigo-600 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
          Chấp nhận
        </button>
        <button type="button" className="flex-1 rounded-full border border-[#e4e6eb] py-1.5 text-sm font-semibold text-[#65676b] hover:bg-[#f0f2f5] transition-colors">
          Từ chối
        </button>
      </div>
    </div>
  );
}

function FriendCard({ name, mutual }) {
  return (
    <div className="bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)] border border-[#e4e6eb] p-4 flex items-center gap-3">
      <div className="h-12 w-12 shrink-0 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center text-base">
        {name[0]}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#1c1e21] truncate">{name}</p>
        <p className="text-xs text-[#65676b]">{mutual}</p>
      </div>
      <button type="button" className="shrink-0 rounded-full border border-[#e4e6eb] px-4 py-1.5 text-sm font-semibold text-[#65676b] hover:bg-[#f0f2f5] transition-colors">
        Nhắn tin
      </button>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconChat = (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337L5.454 21.11A.75.75 0 014 20.25v-4.568c0-1.121-.504-2.176-1.332-2.93C2.629 11.364 2.25 10.746 2.25 10c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
  </svg>
);

const IconFriends = (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.433-2.554M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const IconCog = (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.37.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// ─── Section renderers ────────────────────────────────────────────────────────

function HomeSection({ displayName }) {
  // home_feed
  return (
    <div className="w-full max-w-[900px] mx-auto px-4 py-6 space-y-4">
      <section className="bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)] border border-[#e4e6eb] p-4">
        <div className="flex gap-3 items-start">
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center shrink-0 text-sm">
            {(displayName && displayName[0]?.toUpperCase()) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <label htmlFor="home-composer" className="sr-only">Tạo bài viết</label>
            <textarea
              id="home-composer"
              rows={2}
              readOnly
              placeholder={`${displayName} ơi, bạn đang nghĩ gì thế?`}
              className="w-full resize-none rounded-xl bg-[#f0f2f5] border border-[#e4e6eb] px-4 py-3 text-sm text-[#1c1e21] placeholder:text-[#8a8d91] outline-none cursor-default"
            />
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#f0f2f5]">
              <button type="button" className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-[#65676b] bg-[#f0f2f5] hover:bg-[#e4e6eb] transition-colors cursor-default">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                Ảnh / Video
              </button>
              <button type="button" className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-[#65676b] bg-[#f0f2f5] hover:bg-[#e4e6eb] transition-colors cursor-default">
                <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg>
                Cảm xúc
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-bold text-[#1c1e21]">Bảng tin</h2>
        <span className="text-xs font-medium text-[#8a8d91]">Sắp kết nối API</span>
      </div>
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    </div>
  );
}

function FriendsSection({ subSection }) {
  if (subSection === HOME_SUB_SECTION.friends_all) {
    return (
      <div className="w-full max-w-[900px] mx-auto px-4 py-6 space-y-5">
        <SectionDivider title="Tất cả bạn bè" count={MOCK_FRIENDS.length} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_FRIENDS.map((f) => <FriendCard key={f.id} {...f} />)}
        </div>
      </div>
    );
  }

  // friends_requests (default)
  return (
    <div className="w-full max-w-[900px] mx-auto px-4 py-6 space-y-5">
      <SectionDivider title="Lời mời kết bạn" count={MOCK_REQUESTS.length} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_REQUESTS.map((r) => <FriendRequestCard key={r.id} {...r} />)}
      </div>
    </div>
  );
}

function ProfileSection({ subSection, displayName }) {
  if (subSection === HOME_SUB_SECTION.profile_posts) {
    return (
      <FeedShell title="Bài viết của bạn" description={`Bài đăng của ${displayName}`}>
        <PostSkeleton />
      </FeedShell>
    );
  }

  // profile_info (default)
  return (
    <FeedShell title="Thông tin cá nhân" description={`Xin chào, ${displayName}! Chỉnh sửa thông tin của bạn.`}>
      <div className="bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)] border border-[#e4e6eb] divide-y divide-[#f0f2f5]">
        {['Tên hiển thị', 'Email', 'Giới tính', 'Ngày sinh'].map((label) => (
          <div key={label} className="flex items-center justify-between px-5 py-4">
            <span className="text-sm font-medium text-[#65676b]">{label}</span>
            <SkeletonLine className="h-3 w-28" />
          </div>
        ))}
      </div>
    </FeedShell>
  );
}

function SettingsSection({ subSection }) {
  const map = {
    [HOME_SUB_SECTION.settings_notifications]: { title: 'Thông báo', desc: 'Quản lý thông báo đẩy và email.' },
    [HOME_SUB_SECTION.settings_help]:          { title: 'Trợ giúp',  desc: 'Câu hỏi thường gặp và liên hệ hỗ trợ.' },
  };
  const { title, desc } = map[subSection] || map[HOME_SUB_SECTION.settings_notifications];
  return (
    <FeedShell title={title} description={desc}>
      <EmptyState icon={IconCog}
        title="Chưa có tùy chọn nào"
        description="Tính năng này sẽ sớm ra mắt."
      />
    </FeedShell>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function HomeFeedPlaceholder({ displayName, section, subSection }) {
  if (section === HOME_SECTION.home) {
    return <HomeSection displayName={displayName} />;
  }
  if (section === HOME_SECTION.messages) {
    return (
      <FeedShell title="Tin nhắn" description="Chọn một cuộc trò chuyện ở cột bên cạnh để mở tại đây.">
        <EmptyState icon={IconChat}
          title="Chưa có cuộc trò chuyện nào được chọn"
          description="Chọn một tin nhắn từ danh sách bên trái để xem."
        />
      </FeedShell>
    );
  }
  if (section === HOME_SECTION.friends) {
    return <FriendsSection subSection={subSection} />;
  }
  if (section === HOME_SECTION.profile) {
    return <ProfileSection subSection={subSection} displayName={displayName} />;
  }
  if (section === HOME_SECTION.settings) {
    return <SettingsSection subSection={subSection} />;
  }
  return null;
}
