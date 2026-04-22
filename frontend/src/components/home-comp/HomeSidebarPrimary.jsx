import { HOME_SECTION, HOME_SECTION_LABELS } from './homeSections';

const topItems = [
  HOME_SECTION.home,
  HOME_SECTION.messages,
  HOME_SECTION.friends,
];

const bottomItems = [
  HOME_SECTION.settings,
];

function IconHome({ active }) {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={active ? 2.25 : 1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function IconChat({ active }) {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={active ? 2.25 : 1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337L5.454 21.11A.75.75 0 014 20.25v-4.568c0-1.121-.504-2.176-1.332-2.93C2.629 11.364 2.25 10.746 2.25 10c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}

function IconUsers({ active }) {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={active ? 2.25 : 1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.433-2.554M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function IconCog({ active }) {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={active ? 2.25 : 1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.37.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function SectionIcon({ id, active }) {
  switch (id) {
    case HOME_SECTION.home:
      return <IconHome active={active} />;
    case HOME_SECTION.messages:
      return <IconChat active={active} />;
    case HOME_SECTION.friends:
      return <IconUsers active={active} />;
    case HOME_SECTION.settings:
      return <IconCog active={active} />;
    default:
      return null;
  }
}

function NavButton({ id, active, onSelectSection }) {
  const label = HOME_SECTION_LABELS[id];
  return (
    <button
      key={id}
      type="button"
      onClick={() => onSelectSection(id)}
      title={label}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
        active
          ? 'bg-indigo-50 text-indigo-600'
          : 'text-[#65676b] hover:bg-[#f0f2f5] hover:text-[#1c1e21]'
      }`}
    >
      <SectionIcon id={id} active={active} />
      <span
        className="pointer-events-none absolute left-full top-1/2 z-[60] ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-[#1c1e21] px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
        role="tooltip"
      >
        {label}
      </span>
    </button>
  );
}

export default function HomeSidebarPrimary({ activeSection, onSelectSection }) {
  return (
    <aside
      className="relative z-10 flex w-[72px] shrink-0 flex-col items-center justify-between border-r border-[#e4e6eb] bg-white py-4"
      aria-label="Menu chính"
    >
      <div className="flex flex-col items-center gap-1">
        {topItems.map((id) => (
          <NavButton key={id} id={id} active={activeSection === id} onSelectSection={onSelectSection} />
        ))}
      </div>
      <div className="flex flex-col items-center gap-1">
        {bottomItems.map((id) => (
          <NavButton key={id} id={id} active={activeSection === id} onSelectSection={onSelectSection} />
        ))}
      </div>
    </aside>
  );
}
