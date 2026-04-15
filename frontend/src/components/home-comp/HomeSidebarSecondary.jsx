import { HOME_SECTION } from './homeSections';

const MOCK_CHATS = [
  { id: '1', name: 'Minh Anh', preview: 'Ok nhé, mai gặp!', time: '14:32', unread: 2 },
  { id: '2', name: 'Nhóm POSE 2026', preview: 'Thầy: Deadline tuần sau...', time: 'Hôm qua', unread: 0 },
  { id: '3', name: 'Lan Hương', preview: 'Bạn gửi một ảnh', time: 'T2', unread: 0 },
  { id: '4', name: 'Tuấn Dev', preview: 'Merge xong rồi nhé', time: 'CN', unread: 1 },
];

const MOCK_FRIENDS = [
  { id: 'f1', name: 'Quốc Huy', mutual: '12 bạn chung' },
  { id: 'f2', name: 'Thu Trang', mutual: '5 bạn chung' },
  { id: 'f3', name: 'Đức Anh', mutual: '1 bạn chung' },
];

const MOCK_REQUESTS = [
  { id: 'r1', name: 'Mai Linh', text: '3 bạn chung' },
  { id: 'r2', name: 'Hữu Phước', text: 'Gợi ý cho bạn' },
];

const subsectionTitleClass =
  'px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-[#8a8d91]';

const navButtonClass =
  'flex w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#1c1e21] transition-colors hover:bg-[#f0f2f5]';

function SecondaryHeader({ title, subtitle }) {
  return (
    <div className="border-b border-[#e4e6eb] px-4 py-3">
      <h2 className="text-lg font-bold text-[#1c1e21]">{title}</h2>
      {subtitle ? <p className="mt-0.5 text-xs text-[#65676b]">{subtitle}</p> : null}
    </div>
  );
}

/** Một nhóm mục cấp 2 (cùng style Hồ sơ / Cài đặt / Bạn bè) */
function NavSubsection({ title, children }) {
  return (
    <div className="space-y-0.5">
      <p className={subsectionTitleClass}>{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function RowChat({ name, preview, time, unread }) {
  return (
    <button type="button" className={`${navButtonClass} items-start gap-3`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
        {name[0]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate">{name}</span>
          <span className="shrink-0 text-xs font-normal text-[#8a8d91]">{time}</span>
        </div>
        <p className="truncate text-xs font-normal text-[#65676b]">{preview}</p>
      </div>
      {unread > 0 ? (
        <span className="mt-0.5 flex h-5 min-w-5 shrink-0 items-center justify-center self-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
          {unread}
        </span>
      ) : null}
    </button>
  );
}

function RowFriend({ name, mutual }) {
  return (
    <button type="button" className={`${navButtonClass} items-center gap-3`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e4e6eb] text-sm font-semibold text-[#65676b]">
        {name[0]}
      </div>
      <div className="min-w-0 text-left">
        <p className="truncate">{name}</p>
        <p className="truncate text-xs font-normal text-[#8a8d91]">{mutual}</p>
      </div>
    </button>
  );
}

function RowRequest({ name, text }) {
  return (
    <div className="rounded-xl border border-[#e4e6eb] bg-[#fafbfc] px-3 py-2.5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-sm font-semibold text-amber-800">
          {name[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#1c1e21]">{name}</p>
          <p className="text-xs text-[#65676b]">{text}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Chấp nhận
            </button>
            <button
              type="button"
              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-[#65676b] hover:bg-[#e4e6eb]"
            >
              Từ chối
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomeSidebarSecondary({ activeSection }) {
  return (
    <aside className="flex w-[300px] shrink-0 flex-col border-r border-[#e4e6eb] bg-white overflow-hidden">
      {activeSection === HOME_SECTION.home && (
        <>
          <SecondaryHeader title="Trang chủ" subtitle="Lối tắt và gợi ý" />
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            <NavSubsection title="Lối tắt">
              <button type="button" className={navButtonClass}>
                Đã ghim
              </button>
              <button type="button" className={navButtonClass}>
                Yêu thích
              </button>
              <button type="button" className={navButtonClass}>
                Gần đây
              </button>
            </NavSubsection>
            <NavSubsection title="Gợi ý">
              <p className="px-3 py-2 text-sm text-[#65676b]">Chưa có gợi ý — kết nối thêm bạn bè sau.</p>
            </NavSubsection>
          </div>
        </>
      )}

      {activeSection === HOME_SECTION.messages && (
        <>
          <SecondaryHeader title="Tin nhắn" subtitle="Cuộc trò chuyện" />
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            <NavSubsection title="Gần đây">
              {MOCK_CHATS.map((c) => (
                <RowChat key={c.id} {...c} />
              ))}
            </NavSubsection>
            <NavSubsection title="Nhóm">
              <p className="px-3 py-2 text-sm text-[#65676b]">Chưa tham gia nhóm nào.</p>
            </NavSubsection>
          </div>
        </>
      )}

      {activeSection === HOME_SECTION.friends && (
        <>
          <SecondaryHeader title="Bạn bè" subtitle="Lời mời, danh sách và gợi ý" />
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            <NavSubsection title="Lời mời kết bạn">
              <div className="space-y-2 px-0.5">
                {MOCK_REQUESTS.map((r) => (
                  <RowRequest key={r.id} {...r} />
                ))}
              </div>
            </NavSubsection>
            <NavSubsection title="Tất cả bạn bè">
              {MOCK_FRIENDS.map((f) => (
                <RowFriend key={f.id} {...f} />
              ))}
            </NavSubsection>
            <NavSubsection title="Gợi ý kết bạn">
              <button type="button" className={navButtonClass}>
                Tìm theo trường học
              </button>
              <button type="button" className={navButtonClass}>
                Bạn của bạn bè
              </button>
              <p className="px-3 py-1 text-xs text-[#8a8d91]">Dữ liệu mẫu — sẽ nối API sau.</p>
            </NavSubsection>
          </div>
        </>
      )}

      {activeSection === HOME_SECTION.profile && (
        <>
          <SecondaryHeader title="Hồ sơ" subtitle="Tài khoản của bạn" />
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            <NavSubsection title="Thông tin & nội dung">
              <button type="button" className={navButtonClass}>
                Thông tin cá nhân
              </button>
              <button type="button" className={navButtonClass}>
                Ảnh & thư viện
              </button>
              <button type="button" className={navButtonClass}>
                Bài viết của bạn
              </button>
            </NavSubsection>
            <NavSubsection title="Liên hệ">
              <button type="button" className={navButtonClass}>
                Sổ địa chỉ
              </button>
            </NavSubsection>
          </div>
        </>
      )}

      {activeSection === HOME_SECTION.settings && (
        <>
          <SecondaryHeader title="Cài đặt" subtitle="Ứng dụng & quyền riêng tư" />
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            <NavSubsection title="Bảo mật & quyền">
              <button type="button" className={navButtonClass}>
                Thông báo
              </button>
              <button type="button" className={navButtonClass}>
                Quyền riêng tư
              </button>
            </NavSubsection>
            <NavSubsection title="Hiển thị">
              <button type="button" className={navButtonClass}>
                Ngôn ngữ
              </button>
            </NavSubsection>
            <NavSubsection title="Hỗ trợ">
              <button type="button" className={navButtonClass}>
                Trợ giúp
              </button>
              <button type="button" className={navButtonClass}>
                Điều khoản
              </button>
            </NavSubsection>
          </div>
        </>
      )}
    </aside>
  );
}
