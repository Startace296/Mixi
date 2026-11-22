import { HOME_SUB_SECTION } from "../../lib/navigation";
import {
  NavBtn,
  SecondaryHeader,
  type SecondaryPanelProps,
  type SidebarNavItem,
} from "../common/SidebarNav";

const HOME_SUBSECTION_ITEMS: SidebarNavItem[] = [
  { label: "Feed", subKey: HOME_SUB_SECTION.home_feed },
];

export default function HomeSidebarSecondaryPanel({ activeSubSection, onSelectSubSection }: SecondaryPanelProps) {
  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-r border-[#e4e6eb] bg-white overflow-hidden">
      <SecondaryHeader title="Home" />
      <div className="flex-1 overflow-y-auto p-3">
        <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-[#8a8d91]">
          Sections
        </p>
        {HOME_SUBSECTION_ITEMS.map((item) => (
          <NavBtn
            key={item.subKey}
            label={item.label}
            subKey={item.subKey}
            activeSubSection={activeSubSection}
            onSelect={onSelectSubSection}
          />
        ))}
      </div>
    </aside>
  );
}
