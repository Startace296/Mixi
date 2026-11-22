import { HOME_SUB_SECTION } from "../../lib/navigation";
import {
  SectionedSidebarPanel,
  type SecondaryPanelProps,
  type SidebarNavSection,
} from "../common/SidebarNav";

const FRIENDS_NAV_SECTIONS: SidebarNavSection[] = [
  {
    title: "Requests",
    items: [{ label: "Friend requests", subKey: HOME_SUB_SECTION.friends_requests }],
  },
  {
    title: "Lists",
    items: [{ label: "All friends", subKey: HOME_SUB_SECTION.friends_all }],
  },
];

export default function FriendsSidebarSecondaryPanel(props: SecondaryPanelProps) {
  return (
    <SectionedSidebarPanel
      title="Friends"
      subtitle="Requests and lists"
      sections={FRIENDS_NAV_SECTIONS}
      {...props}
    />
  );
}
