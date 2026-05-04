import { HOME_SUB_SECTION } from "../../lib/homeSections.js";

const SETTINGS_NAV_SECTIONS = [
  {
    title: "Account",
    items: [{ label: "Change password", subKey: HOME_SUB_SECTION.settings_change_password }],
  },
];

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
      <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-[#8a8d91]">
        {title}
      </p>
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
        isActive ? "bg-indigo-50 text-indigo-600" : "text-[#1c1e21] hover:bg-[#f0f2f5]"
      }`}
    >
      {label}
    </button>
  );
}

export default function SettingsSidebarSecondaryPanel({ activeSubSection, onSelectSubSection }) {
  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-r border-[#e4e6eb] bg-white overflow-hidden">
      <SecondaryHeader title="Settings" subtitle="Account preferences" />
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {SETTINGS_NAV_SECTIONS.map((group) => (
          <NavSubsection key={group.title} title={group.title}>
            {group.items.map((item) => (
              <NavBtn
                key={item.subKey}
                label={item.label}
                subKey={item.subKey}
                activeSubSection={activeSubSection}
                onSelect={onSelectSubSection}
              />
            ))}
          </NavSubsection>
        ))}
      </div>
    </aside>
  );
}
