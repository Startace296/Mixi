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

const ICON_CHAT = (
  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337L5.454 21.11A.75.75 0 014 20.25v-4.568c0-1.121-.504-2.176-1.332-2.93C2.629 11.364 2.25 10.746 2.25 10c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
  </svg>
);

export default function ChatSectionView() {
  return (
    <FeedShell title="Messages" description="Choose a conversation from the sidebar to open it here.">
      <EmptyState
        icon={ICON_CHAT}
        title="No conversation selected yet"
        description="Select a message thread from the left panel to view it."
      />
    </FeedShell>
  );
}
