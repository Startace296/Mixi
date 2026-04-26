import { HOME_SUB_SECTION } from "../../lib/homeSections.js";

function SecondaryHeader({ title, subtitle }) {
  return (
    <div className="border-b border-[#e4e6eb] px-4 py-3">
      <h2 className="text-lg font-bold text-[#1c1e21]">{title}</h2>
      {subtitle ? <p className="mt-0.5 text-xs text-[#65676b]">{subtitle}</p> : null}
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
        isActive ? "bg-indigo-50 text-indigo-600" : "text-[#1c1e21] hover:bg-[#f0f2f5]"
      }`}
    >
      {label}
    </button>
  );
}

export default function HomeSidebarSecondaryPanel({ activeSubSection, onSelectSubSection }) {
  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-r border-[#e4e6eb] bg-white overflow-hidden">
      <SecondaryHeader title="Home" />
      <div className="flex-1 overflow-y-auto p-3">
        <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-[#8a8d91]">
          Shortcuts
        </p>
        <NavBtn
          label="Feed"
          subKey={HOME_SUB_SECTION.home_feed}
          activeSubSection={activeSubSection}
          onSelect={onSelectSubSection}
        />
      </div>
    </aside>
  );
}
