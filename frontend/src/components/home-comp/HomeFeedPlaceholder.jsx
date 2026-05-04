import { HOME_SECTION } from '../../lib/homeSections.js';
import HomeSectionView from './HomeSectionView.jsx';
import FriendsSectionView from '../friend-comp/FriendsSectionView.jsx';
import ProfileSectionView from '../profile-comp/ProfileSectionView.jsx';
import SettingsSectionView from '../setting-comp/SettingsSectionView.jsx';
import ChatSectionView from '../chat-comp/ChatSectionView.jsx';

export default function HomeFeedPlaceholder({
  user,
  displayName,
  section,
  subSection,
  selectedChatThread,
  viewedProfile,
  onUserChange,
  onOpenProfile,
  onSelectSection,
  onOpenChatWithFriend,
}) {
  if (section === HOME_SECTION.home) {
    return (
      <HomeSectionView
        displayName={displayName}
        user={user}
        subSection={subSection}
        onOpenProfile={onOpenProfile}
        onSelectSection={onSelectSection}
      />
    );
  }
  if (section === HOME_SECTION.messages) {
    return <ChatSectionView selectedChatThread={selectedChatThread} onOpenProfile={onOpenProfile} user={user} />;
  }
  if (section === HOME_SECTION.friends) {
    return (
      <FriendsSectionView
        subSection={subSection}
        onOpenChatWithFriend={onOpenChatWithFriend}
        onOpenProfile={onOpenProfile}
      />
    );
  }
  if (section === HOME_SECTION.profile) {
    return (
      <ProfileSectionView
        displayName={displayName}
        user={user}
        viewedProfile={viewedProfile}
        onUserChange={onUserChange}
      />
    );
  }
  if (section === HOME_SECTION.settings) {
    return <SettingsSectionView subSection={subSection} />;
  }
  return null;
}
