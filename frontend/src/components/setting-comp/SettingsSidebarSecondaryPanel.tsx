import { HOME_SUB_SECTION } from "../../lib/navigation";
import {
  SectionedSidebarPanel,
  type SecondaryPanelProps,
  type SidebarNavSection,
} from "../common/SidebarNav";

const SETTINGS_NAV_SECTIONS: SidebarNavSection[] = [
  {
    title: "Account",
    items: [{ label: "Change password", subKey: HOME_SUB_SECTION.settings_change_password }],
  },
];

export default function SettingsSidebarSecondaryPanel(props: SecondaryPanelProps) {
  return (
    <SectionedSidebarPanel
      title="Settings"
      subtitle="Account preferences"
      sections={SETTINGS_NAV_SECTIONS}
      {...props}
    />
  );
}
