import { HOME_SECTION, HOME_SUB_SECTION } from './homeSections';

const MOCK_CHATS = [
  { id: '1', name: 'Minh Anh', preview: 'Okay, see you tomorrow!', time: '14:32', unread: 2 },
  { id: '3', name: 'Lan Huong', preview: 'You sent a photo', time: 'Mon', unread: 0 },
  { id: '4', name: 'Tuan Dev', preview: 'Merge is done.', time: 'Sun', unread: 1 },
];

const MOCK_GROUPS = [
  { id: 'g1', name: 'POSE 2026 Group', preview: 'Teacher: Deadline next week...', time: 'Yesterday', unread: 0 },
];

const subsectionTitleClass =
  'px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-[#8a8d91]';

function SecondaryHeader({ title, subtitle }) {
  return (
    <div className="border-b border-[#e4e6eb] px-4 py-3">
      <h2 className="text-lg font-bold text-[#1c1e21]">{title}</h2>
      {subtitle ? <p className="mt-0.5 text-xs text-[#65676b]">{subtitle}</p> : null}
    </div>
  );
}

function NavSubsection({ title, children }) {
  return (
    <div className="space-y-0.5">
      <p className={subsectionTitleClass}>{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavBtn({ label, subKey, activeSubSection, onSelect }) {
  const isActive = activeSubSection === subKey;
  return (
    <button
      type="button"
      onClick={() => onSelect(subKey)}
      className={`flex w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
        isActive
          ? 'bg-indigo-50 text-indigo-600'
          : 'text-[#1c1e21] hover:bg-[#f0f2f5]'
      }`}
    >
      {label}
    </button>
  );
}

function RowChat({ name, preview, time, unread }) {
  return (
    <button type="button" className="flex w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#1c1e21] transition-colors hover:bg-[#f0f2f5] items-start gap-3">
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
      {unread > 0 && (
        <span className="mt-0.5 flex h-5 min-w-5 shrink-0 items-center justify-center self-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
          {unread}
        </span>
      )}
    </button>
  );
}

export default function HomeSidebarSecondary({ activeSection, activeSubSection, onSelectSubSection }) {
  return (
      <aside className="flex h-full w-[300px] shrink-0 flex-col border-r border-[#e4e6eb] bg-white overflow-hidden">

      {activeSection === HOME_SECTION.home && (
        <>
          <SecondaryHeader title="Home" />
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            <NavSubsection title="Shortcuts">
              <NavBtn label="Feed" subKey={HOME_SUB_SECTION.home_feed} activeSubSection={activeSubSection} onSelect={onSelectSubSection} />
            </NavSubsection>
          </div>
        </>
      )}

      {activeSection === HOME_SECTION.messages && (
        <>
          <SecondaryHeader title="Messages" subtitle="Conversations" />
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            <NavSubsection title="Recent">
              {MOCK_CHATS.map((c) => <RowChat key={c.id} {...c} />)}
            </NavSubsection>
            <NavSubsection title="Groups">
              {MOCK_GROUPS.map((c) => <RowChat key={c.id} {...c} />)}
            </NavSubsection>
          </div>
        </>
      )}

      {activeSection === HOME_SECTION.friends && (
        <>
          <SecondaryHeader title="Friends" subtitle="Requests and lists" />
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            <NavSubsection title="Requests">
              <NavBtn label="Friend requests" subKey={HOME_SUB_SECTION.friends_requests} activeSubSection={activeSubSection} onSelect={onSelectSubSection} />
            </NavSubsection>
            <NavSubsection title="Lists">
              <NavBtn label="All friends" subKey={HOME_SUB_SECTION.friends_all} activeSubSection={activeSubSection} onSelect={onSelectSubSection} />
            </NavSubsection>
          </div>
        </>
      )}

      {activeSection === HOME_SECTION.settings && (
        <>
          <SecondaryHeader title="Settings" subtitle="App and support" />
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            <NavSubsection title="Notifications">
              <NavBtn label="Notifications" subKey={HOME_SUB_SECTION.settings_notifications} activeSubSection={activeSubSection} onSelect={onSelectSubSection} />
            </NavSubsection>
            <NavSubsection title="Support">
              <NavBtn label="Help" subKey={HOME_SUB_SECTION.settings_help} activeSubSection={activeSubSection} onSelect={onSelectSubSection} />
            </NavSubsection>
          </div>
        </>
      )}

    </aside>
  );
}
