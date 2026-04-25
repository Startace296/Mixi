import { HOME_SUB_SECTION } from '../../lib/homeSections';

function EmptyState({ icon, title, description }) {
  return (
    <div className="rounded-lg border border-[#e4e6eb] bg-white px-8 py-16 text-center shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)]">
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
    <div className="mx-auto w-full max-w-[900px] space-y-4 px-4 py-6">
      <div className="rounded-lg border border-[#e4e6eb] bg-white px-5 py-4 shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)]">
        <h1 className="text-xl font-bold text-[#1c1e21]">{title}</h1>
        {description && <p className="mt-1 text-sm text-[#65676b]">{description}</p>}
      </div>
      {children}
    </div>
  );
}

const ICON_COG = (
  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.37.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default function SettingsSectionView({ subSection }) {
  const map = {
    [HOME_SUB_SECTION.settings_notifications]: {
      title: 'Notifications',
      desc: 'Manage push and email notifications.',
    },
    [HOME_SUB_SECTION.settings_help]: {
      title: 'Help',
      desc: 'FAQ and support contact.',
    },
  };

  const { title, desc } = map[subSection] || map[HOME_SUB_SECTION.settings_notifications];

  return (
    <FeedShell title={title} description={desc}>
      <EmptyState
        icon={ICON_COG}
        title="No options yet"
        description="This feature is coming soon."
      />
    </FeedShell>
  );
}
